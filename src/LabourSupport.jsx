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
    transform, opacity, filter:selected?'blur(0px)':`blur(${Math.max(0,distance)+2}px)`,
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
  const select = index => moveTo(index);
  const advance = direction => moveTo(Math.max(0,Math.min(areas.length-1,Math.round(target.current) + direction)));

  useEffect(() => {
    const element = section.current;
    let engaged=false;
    let touchY=null;
    let previousY=window.scrollY;
    let previousStop=0;
    const last=areas.length-1;
    const anchor=()=>{
      const bounds=element.getBoundingClientRect();
      return Math.round(Math.max(0,window.scrollY+bounds.top+(bounds.height-window.innerHeight)/2));
    };
    function setEngaged(value){
      engaged=value;
      document.documentElement.classList.toggle('labour-orbit-scroll-locked',value);
    }
    previousStop=anchor();
    function hold(stop){
      previousY=stop;
      previousStop=stop;
      if(Math.abs(window.scrollY-stop)>=1)window.scrollTo({top:stop,behavior:'instant'});
    }
    function enter(direction,stop){
      setEngaged(true);
      const entry=direction>0?0:last;
      moveTo(entry);
      spring.jump(entry);
      hold(stop);
    }
    function guardScroll(){
      const y=window.scrollY;
      const stop=anchor();
      const direction=Math.sign(y-previousY);
      if(!direction){previousStop=stop;return;}
      const crossed=direction>0?previousY<previousStop-2&&y>=stop:previousY>previousStop+2&&y<=stop;
      if(engaged){
        const endpoint=direction>0?last:0;
        const complete=Math.round(target.current)===endpoint;
        if(!complete){hold(stop);return;}
        setEngaged(false);
      }else if(crossed){
        // Native momentum, PageDown/End and scrollbar jumps may have no cancellable wheel event.
        enter(direction,stop);
        return;
      }
      previousY=y;
      previousStop=stop;
    }
    function consume(event,pixels) {
      if(!pixels||event.target.closest('input,select,textarea,[role="dialog"]'))return;
      const stop=anchor();
      const y=window.scrollY;
      const direction=Math.sign(pixels);
      const atAnchor=Math.abs(y-stop)<3;
      // Intercept on the page, before a large wheel/touch delta can jump past the section.
      const crossing=direction>0?y<stop&&y+pixels>=stop:y>stop&&y+pixels<=stop;
      if(!engaged&&!atAnchor&&!crossing)return;
      if(!engaged){
        setEngaged(true);
        if(crossing&&!atAnchor){
          event.preventDefault();
          enter(direction,stop);
          return;
        }
      }
      // Release immediately at either boundary, even while the spring is settling.
      const endpoint=direction>0?last:0;
      if(Math.round(target.current)===endpoint){
        moveTo(endpoint);
        spring.jump(endpoint);
        setEngaged(false);
        event.preventDefault();
        window.scrollBy({top:pixels,behavior:'instant'});
        previousY=window.scrollY;
        previousStop=anchor();
        return;
      }
      event.preventDefault();
      const next=target.current+Math.max(-.65,Math.min(.65,pixels/240));
      moveTo(Math.max(0,Math.min(last,Math.max(position.get()-.75,Math.min(position.get()+.75,next)))));
    }
    function rotate(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
      consume(event,pixels);
    }
    function keyScroll(event){
      if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,select,textarea,button,a,[contenteditable="true"]'))return;
      const direction={PageDown:1,PageUp:-1,ArrowDown:1,ArrowUp:-1,End:1,Home:-1,' ':event.shiftKey?-1:1}[event.key];
      if(!direction)return;
      const distance=engaged?240:['End','Home'].includes(event.key)?document.documentElement.scrollHeight:window.innerHeight;
      consume(event,direction*distance);
    }
    function touchStart(event){touchY=event.touches.length===1?event.touches[0].clientY:null;}
    function touchMove(event){
      if(touchY===null||event.touches.length!==1)return;
      const next=event.touches[0].clientY;
      consume(event,touchY-next);
      if(event.defaultPrevented)suppressClick.current=performance.now()+500;
      touchY=next;
    }
    function release(){setEngaged(false);previousY=window.scrollY;previousStop=anchor();}
    window.addEventListener('wheel',rotate,{passive:false,capture:true});
    window.addEventListener('scroll',guardScroll,{passive:true});
    window.addEventListener('keydown',keyScroll);
    window.addEventListener('touchstart',touchStart,{passive:true});
    window.addEventListener('touchmove',touchMove,{passive:false});
    window.addEventListener('resize',release);
    return () => {
      setEngaged(false);
      window.removeEventListener('wheel',rotate,true);
      window.removeEventListener('scroll',guardScroll);
      window.removeEventListener('keydown',keyScroll);
      window.removeEventListener('touchstart',touchStart);
      window.removeEventListener('touchmove',touchMove);
      window.removeEventListener('resize',release);
      clearTimeout(snapTimer.current);
    };
  }, [areas.length, moveTo, position, spring]);

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
      if (Math.abs(dx) > 40 && Math.abs(dx)>Math.abs(dy)) {
        const direction=Math.sign(dx);
        suppressClick.current=performance.now()+400;
        if (wrap(Math.round(target.current),areas.length) === areas.length-1 && direction > 0) section.current.nextElementSibling?.scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start'});
        else advance(direction);
      }
      swipe.current=null;
    }}
    onPointerCancel={() => { swipe.current=null; }}>
    <div className="labour-orbit-backdrop" aria-hidden="true"/>
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
