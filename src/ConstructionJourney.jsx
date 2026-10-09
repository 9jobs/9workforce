import React, {useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import './construction-journey.css';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
const fade = (p, enter, leave) => clamp((p - enter) / .035) * (1 - clamp((p - leave) / .035));

export default function ConstructionJourney() {
  const section = useRef(null);
  const navigate = useNavigate();
  const skip = useRef(() => {});

  useEffect(() => {
    const root = section.current;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let cancelled = false;
    let disposeAnimation = () => {};
    let generation = 0;
    const photo = root.querySelector('.construction-photo');
    const picture = root.querySelector('picture');
    const panels = [...root.querySelectorAll('[data-story-copy]')];
    const cta = root.querySelector('.construction-cta');
    const meter = root.querySelector('.construction-progress-fill');
    const host = root.querySelector('.construction-canvas');
    const nextSection = root.nextElementSibling;
    let photoReady = false;
    let refreshVisual = () => {};
    const onPhotoLoad = () => { photoReady = true; refreshVisual(); };
    photo.addEventListener('load', onPhotoLoad);

    const loadPhoto = () => {
      picture.querySelectorAll('[data-srcset]').forEach(el => { el.srcset = el.dataset.srcset; });
      photo.src = photo.dataset.src;
      photoReady = photo.complete && photo.naturalWidth > 0;
    };
    const setStatic = () => {
      root.dataset.mode = 'static';
      root.dataset.progress = '1';
      loadPhoto();
      cta.inert = false;
      cta.removeAttribute('aria-hidden');
      panels.forEach(panel => panel.style.removeProperty('opacity'));
      cta.style.removeProperty('opacity');
      cta.style.removeProperty('visibility');
      photo.style.cssText = '';
    };

    async function setup() {
      const run = ++generation;
      disposeAnimation();
      disposeAnimation = () => {};
      if (media.matches) { setStatic(); return; }
      root.dataset.mode = 'loading';
      let scene;
      let context;
      try {
        const [{gsap}, {ScrollTrigger}, {createConstructionScene}] = await Promise.all([
          import('gsap'), import('gsap/ScrollTrigger'), import('./construction/createConstructionScene'),
        ]);
        if (cancelled || run !== generation) return;
        // The existing route entrance briefly transforms this ancestor. Wait for it
        // to settle so fixed pinning can stay inside React's event delegation root.
        const page = root.closest('.motion-page');
        if (page) await new Promise(resolve => {
          const settled = () => {
            if (cancelled || run !== generation || getComputedStyle(page).transform === 'none') resolve();
            else requestAnimationFrame(settled);
          };
          settled();
        });
        if (cancelled || run !== generation) return;
        gsap.registerPlugin(ScrollTrigger);
        loadPhoto();
        scene = createConstructionScene(host, () => { disposeAnimation(); setStatic(); });
        root.dataset.mode = 'animated';
        const state = {progress: 0};
        const update = () => {
          const p = state.progress;
          root.dataset.progress = p.toFixed(4);
          scene.render(p);
          const reveal = photoReady ? smooth((p - .57) / .105) : 0;
          const push = smooth((p - .68) / .11);
          const pull = smooth((p - .82) / .15);
          // One photographic plate bridges into human detail; geometry owns the first four beats.
          photo.style.opacity = reveal;
          photo.style.transform = `scale(${1.08 + .31 * push - .38 * pull}) translate3d(${-3 * push + 3 * pull}%, ${-3 * push + 3 * pull}%, 0)`;
          photo.style.filter = `saturate(${.65 + reveal * .35})`;
          host.style.opacity = 1 - reveal;
          panels[0].style.opacity = 1 - clamp((p - .17) / .04);
          panels[1].style.opacity = fade(p, .23, .46);
          panels[2].style.opacity = fade(p, .66, .81);
          const finalOpacity = clamp((p - .86) / .065);
          cta.style.opacity = finalOpacity;
          cta.style.visibility = finalOpacity > 0 ? 'visible' : 'hidden';
          cta.inert = finalOpacity < .95;
          cta.setAttribute('aria-hidden', String(finalOpacity < .95));
          root.style.setProperty('--final-shade', finalOpacity);
          meter.style.transform = `scaleX(${p})`;
        };
        refreshVisual = update;
        const enteredFromBelow = root.getBoundingClientRect().bottom <= 0;
        const nextTop = enteredFromBelow ? nextSection?.getBoundingClientRect().top : null;
        context = gsap.context(() => {
          gsap.fromTo(state, {progress: 0}, {
            progress: 1, ease: 'none', onUpdate: update,
            immediateRender: false,
            scrollTrigger: {
              id: 'construction-journey', trigger: root, start: 'top top',
              end: () => `+=${Math.round(root.offsetHeight * (innerWidth < 768 ? 4.5 : 5.5))}`,
              // Fixed pinning avoids scroll-thread/compositor drift from transform pinning.
              pin: true, pinType: 'fixed', scrub: 1.05,
              onLeave: self => { self.getTween()?.progress(1); self.animation.progress(1); },
              onLeaveBack: self => { self.getTween()?.progress(1); self.animation.progress(0); },
              onEnterBack: () => update(),
            },
          });
        }, root);
        // If imports finish after a visitor has already passed the section, keep the
        // lower-page content in place when pin spacing is inserted above the viewport.
        if (nextTop != null) {
          window.scrollBy({top: nextSection.getBoundingClientRect().top - nextTop, behavior: 'instant'});
          ScrollTrigger.update();
          const trigger = ScrollTrigger.getById('construction-journey');
          trigger.getTween()?.progress(1);
          trigger.animation.progress(trigger.progress);
        }
        update();
        const refresh = () => { if (!cancelled && run === generation) ScrollTrigger.refresh(true); };
        if (document.fonts.status !== 'loaded') document.fonts.ready.then(refresh);
        // Refresh once the existing hero image has settled, too.
        const hero = document.querySelector('.home-hero-site img');
        hero?.addEventListener('load', refresh, {once: true});
        skip.current = () => {
          const trigger = ScrollTrigger.getById('construction-journey');
          window.scrollTo({top: trigger ? trigger.end + root.offsetHeight : root.offsetTop + root.offsetHeight, behavior: 'instant'});
          ScrollTrigger.update();
          const next = nextSection;
          if (next) { next.setAttribute('tabindex', '-1'); next.focus({preventScroll: true}); }
        };
        disposeAnimation = () => {
          hero?.removeEventListener('load', refresh);
          context.revert();
          scene.dispose();
          host.style.opacity = '';
          root.style.removeProperty('--final-shade');
          skip.current = () => {};
          refreshVisual = () => {};
        };
      } catch (error) {
        context?.revert();
        scene?.dispose();
        if (!cancelled && run === generation) setStatic();
        console.warn('Construction experience uses its accessible static fallback.', error);
      }
    }

    // Keep Three.js, GSAP and the photographic asset out of the initial hero load.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      observer.disconnect();
      window.removeEventListener('scroll', onApproach);
      setup();
    };
    const onApproach = () => { if (root.getBoundingClientRect().top <= innerHeight + 600) start(); };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) start();
    }, {rootMargin: '600px'});
    observer.observe(root);
    // IntersectionObserver can miss a whole section during scrollbar jumps/fast flings.
    window.addEventListener('scroll', onApproach, {passive: true});
    onApproach();
    const onPreference = () => { observer.disconnect(); window.removeEventListener('scroll', onApproach); started = true; setup(); };
    media.addEventListener('change', onPreference);
    return () => {
      cancelled = true;
      generation++;
      observer.disconnect();
      window.removeEventListener('scroll', onApproach);
      media.removeEventListener('change', onPreference);
      photo.removeEventListener('load', onPhotoLoad);
      disposeAnimation();
    };
  }, []);

  return <section ref={section} className="construction-journey" data-mode="loading" aria-label="From construction plans to people on site">
    <div className="construction-canvas" aria-hidden="true"/>
    <picture aria-hidden="true">
      <source media="(max-width: 767px)" data-srcset="/assets/construction-journey/site-mobile.webp"/>
      <img className="construction-photo" data-src="/assets/construction-journey/site-wide.webp" alt="" width="2048" height="1152" decoding="async"/>
    </picture>
    <div className="construction-vignette" aria-hidden="true"/>
    <p className="construction-sr-only">Follow a construction plan as it becomes a dimensional building, with concrete floors, columns, formwork, scaffolding and cranes. Construction labourers finish concrete, carry materials and assist trades on site.</p>
    <div className="construction-copy construction-copy-plan" data-story-copy aria-hidden="true"><span className="construction-kicker">THE START OF SOMETHING GREAT</span><h2>Every great build<br/>starts with <em>a plan.</em></h2><p>From the first line.<br/>To the last detail.</p></div>
    <div className="construction-copy" data-story-copy aria-hidden="true"><span className="construction-kicker">BUILT FROM THE GROUND UP</span><h2>Vision takes<br/><em>shape.</em></h2><p>Solid foundations.<br/>Real progress.</p></div>
    <div className="construction-copy construction-copy-workers" data-story-copy aria-hidden="true"><span className="construction-kicker">POWERED BY PEOPLE</span><h2>The right people.<br/><em>At every stage.</em></h2><p>General labour. Concrete work.<br/>Trade assistance.</p></div>
    <div className="construction-cta" aria-hidden="true" inert>
      <span className="construction-kicker">YOUR NEXT PROJECT STARTS HERE</span>
      <h2>Need reliable<br/><em>construction labour?</em></h2>
      <p>Tell us what you need. We'll find the right workers.</p>
      <button type="button" className="construction-request" onClick={() => navigate('/request-workers')}>GET MY WORKFORCE</button>
    </div>
    <div className="construction-progress" aria-hidden="true" style={{display:'none'}}><div className="construction-progress-fill"/></div>
  </section>;
}
