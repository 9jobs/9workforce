import React, {useEffect, useRef, useState} from 'react';
import {useReducedMotion} from 'framer-motion';

export default function HeroVideo({source, mobile = false}) {
  const videoRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 860px)');
    const update = () => setActive(query.matches === mobile);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [mobile]);

  useEffect(() => {setRevealed(false); setFailed(false);}, [source, active]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active || reducedMotion || failed) return;
    let visible = true;
    let cancelled = false;
    let introComplete = false;
    const sync = () => {
      if (document.hidden || !visible || !introComplete) {
        video.pause();
        return;
      }
      video.play().catch(() => {if (!cancelled) setFailed(true);});
    };
    const timer = window.setTimeout(() => {introComplete = true; sync();}, 350);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video);
    video.addEventListener('canplay', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      video.removeEventListener('canplay', sync);
      video.pause();
    };
  }, [source, active, reducedMotion, failed]);

  if (!source || !active || reducedMotion || failed) return null;
  return <video ref={videoRef} className={`home-hero-video${revealed ? ' is-playing' : ''}`}
    src={source} muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1}
    onPlaying={() => setRevealed(true)}
    onError={() => setFailed(true)}/>;
}
