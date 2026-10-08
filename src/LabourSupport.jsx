import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform} from 'framer-motion';
import {ArrowRight, ShieldCheck, ClipboardCheck, Zap} from 'lucide-react';
import './labour-support.css';

const photos = ['general-labour.png', 'construction-worker.png', 'trade-team.png', 'civil-excavation.png', 'labour-site-team.png', 'traffic-control.png', 'materials-worker.png', 'site-sunset.png'];
const benefits = [
  [ShieldCheck, 'Verified Workers', 'Experience and relevant tickets reviewed.'],
  [ClipboardCheck, 'Site Ready', 'Site requirements and inductions coordinated.'],
  [Zap, 'Responsive Support', 'Workforce support around your project needs.'],
];

const wrap = (value, length) => ((value % length) + length) % length;

function OrbitCard({area, description, index, count, position, active, expanded, onToggle}) {
  const offset = useTransform(position, value => wrap(index - value + 1, count) - 1);
  const transform = useTransform(offset, value => {
    const angle = (-44 + value * 26) * Math.PI / 180;
    return `translate3d(calc(var(--orbit-radius) * ${Math.cos(angle)}),calc(var(--orbit-radius) * ${Math.sin(angle)}),0) translate(-50%,-50%) rotate(${value * 13}deg)`;
  });
  const opacity = useTransform(offset, [-1,0,1,2,3,4], [0,1,.52,.26,.08,0]);
  const distance = wrap(index - active + 1, count) - 1;
  const selected = index === active;
  const visible = distance >= 0 && distance <= 3;
  return <motion.article className={`labour-orbit-card${selected?' is-active':''}`} aria-hidden={!selected} style={{
    transform, opacity, filter:selected?'blur(0px)':`blur(${Math.max(0,distance) + 1}px)`,
    zIndex:selected?10:5-Math.abs(distance), pointerEvents:visible?'auto':'none',
  }}>
    <div className="labour-orbit-card-photo"><img src={`/assets/${photos[index]}`} alt="" loading={visible?'eager':'lazy'} decoding="async"/><span className="labour-orbit-card-label"><i/>{selected?'ACTIVE ROLE':'SITE SUPPORT'}</span><span className="labour-orbit-card-number">{String(index + 1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span></div>
    <div className="labour-orbit-card-body"><h3>{area}</h3><p className="labour-orbit-card-summary">{description}</p><button type="button" tabIndex={selected?0:-1} aria-label={`${expanded?'Hide':'Show'} ${area} details`} aria-expanded={expanded} aria-controls={selected?`work-area-panel-${index}`:undefined} onClick={event => { event.stopPropagation(); onToggle(expanded?null:index); }}><ArrowRight size={18} aria-hidden="true"/></button></div>
  </motion.article>;
}

export default function LabourSupport({areas, descriptions, openArea, setOpenArea}) {
  const [active, setActive] = useState(0);
  const section = useRef(null);
  const swipe = useRef(null);
  const suppressClick = useRef(0);
  const snapTimer = useRef(null);
  const target = useRef(0);
  const reduceMotion = useReducedMotion();
  const input = useMotionValue(0);
  const spring = useSpring(input, {stiffness:210, damping:32, mass:.65, restDelta:.001, restSpeed:.001});
  const position = reduceMotion ? input : spring;
  useMotionValueEvent(position, 'change', value => setActive(wrap(Math.round(value), areas.length)));
  const moveTo = useCallback(value => {
    clearTimeout(snapTimer.current);
    target.current = value;
    input.set(value);
  }, [input]);
  const select = index => moveTo(Math.round(target.current) + index - wrap(Math.round(target.current), areas.length));
  const advance = direction => moveTo(Math.round(target.current) + direction);

  useEffect(() => {
    const element = section.current;
    function rotate(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const direction = Math.sign(event.deltaY);
      const cycle = Math.floor(target.current / areas.length) * areas.length;
      const first = cycle;
      const last = cycle + areas.length - 1;
      // Hand page scrolling back at either end, including trackpad momentum.
      if (!direction || (target.current <= first && direction < 0) || (target.current >= last && direction > 0)) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
      const delta = Math.max(-180,Math.min(180,pixels)) / 120;
      moveTo(Math.max(first,Math.min(last,target.current + delta)));
      // Follow every wheel event, then gently settle on the nearest card.
      snapTimer.current = setTimeout(() => moveTo(Math.round(target.current)), 140);
    }
    element.addEventListener('wheel', rotate, {passive:false});
    return () => { element.removeEventListener('wheel', rotate); clearTimeout(snapTimer.current); };
  }, [areas.length, moveTo]);

  function keyboard(event) {
    if (event.target !== event.currentTarget) return;
    const directions = {ArrowDown:1, ArrowRight:1, ArrowUp:-1, ArrowLeft:-1};
    if (event.key in directions) { event.preventDefault(); advance(directions[event.key]); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); select(event.key === 'Home'?0:areas.length-1); }
  }

  return <section className="labour-orbit" ref={section} tabIndex={0} role="region" aria-roledescription="carousel" aria-labelledby="labour-orbit-heading" onKeyDown={keyboard}
    onClick={event => { if (event.target.closest('a,button') || performance.now() < suppressClick.current || window.getSelection()?.toString()) return; advance(1); }}
    onPointerDown={event => { if (event.pointerType !== 'mouse' && !event.target.closest('a,button')) { swipe.current = {x:event.clientX,y:event.clientY}; event.currentTarget.setPointerCapture(event.pointerId); } }}
    onPointerUp={event => {
      if (!swipe.current) return;
      const dx=swipe.current.x-event.clientX; const dy=swipe.current.y-event.clientY;
      if (Math.max(Math.abs(dx),Math.abs(dy)) > 40) {
        const direction=Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : Math.sign(dx);
        suppressClick.current=performance.now()+400;
        if (wrap(Math.round(target.current),areas.length) === areas.length-1 && direction > 0) section.current.nextElementSibling?.scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start'});
        else advance(direction);
      }
      swipe.current=null;
    }}
    onPointerCancel={() => { swipe.current=null; }}>
    <div className="labour-orbit-backdrop" aria-hidden="true">
      <span className="labour-orbit-glow labour-orbit-glow-blue"/>
      <span className="labour-orbit-glow labour-orbit-glow-warm"/>
      <span className="labour-orbit-glow labour-orbit-glow-soft"/>
      <span className="labour-orbit-halo labour-orbit-halo-left"/>
      <span className="labour-orbit-halo labour-orbit-halo-right"/>
      <div className="labour-orbit-particles"><i/><i/><i/><i/><i/><i/><i/><i/></div>
    </div>
    <span className="labour-orbit-sr" role="status" aria-live="polite" aria-atomic="true">{active + 1} of {areas.length}: {areas[active]}. Click the section or use arrow keys to rotate.</span>
    <div className="labour-orbit-inner">
      <div className="labour-orbit-copy">
        <h2 id="labour-orbit-heading">Skilled site support,<br/>made simple<span>.</span></h2>
        <p className="labour-orbit-intro">Reliable construction workers for site tasks, material handling, civil works and specialist support across Melbourne and Victoria.</p>
        <div className="labour-orbit-benefits">{benefits.map(([Icon, title, copy]) => <div key={title}><span><Icon size={19} aria-hidden="true"/></span><div><strong>{title}</strong><p>{copy}</p></div></div>)}</div>
        <Link className="labour-orbit-cta" to="/contact">REQUEST WORKERS <span><ArrowRight size={17} aria-hidden="true"/></span></Link>
      </div>
      <div className="labour-orbit-display">
        <div className="labour-orbit-stage">
          {areas.map((area,index) => <OrbitCard key={area} area={area} description={descriptions[index]} index={index} count={areas.length} position={position} active={active} expanded={openArea === index} onToggle={setOpenArea}/>)}
        </div>
        <div className="labour-orbit-detail" id={`work-area-panel-${active}`} hidden={openArea !== active}><strong>{areas[active]}</strong><p>{descriptions[active]}</p></div>
      </div>
    </div>
  </section>;
}
