import React, {useEffect, useRef, useState} from 'react';
import {useInView, useReducedMotion} from 'framer-motion';
import {Link} from 'react-router-dom';
import {ArrowRight, HardHat, Users} from 'lucide-react';
import {getWorkRolePath} from './workRolePaths';
import './home-solutions.css';

const highlights = [
  [Users, 'Reliable support', 'Workers matched to site requirements.'],
  [HardHat, 'Safety focus', 'Experience, tickets and inductions reviewed.'],
  [ArrowRight, 'Clear communication', 'Responsive contact and site coordination.'],
];

export default function HomeSolutions({roles}) {
  const gridRef = useRef(null);
  const visible = useInView(gridRef, {once:true, amount:.18});
  const reducedMotion = useReducedMotion();
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!visible || reducedMotion || !gridRef.current) return;
    const grid = gridRef.current;
    const controls = [];
    setBurst(true);
    [...grid.querySelectorAll('.solution')].forEach((card, index) => {
      const originX = grid.clientWidth / 2 - card.offsetLeft - card.offsetWidth / 2;
      const originY = grid.clientHeight / 2 - card.offsetTop - card.offsetHeight / 2;
      const squareSize = Math.min(card.offsetWidth, card.offsetHeight) * .84;
      const squareClip = `inset(${(card.offsetHeight - squareSize) / 2}px ${(card.offsetWidth - squareSize) / 2}px round 16px)`;
      controls.push(card.animate([
        {transform:`translate(${originX + (index % 2 ? 12 : -12)}px, ${originY + (index < 2 ? -12 : 12)}px) scale(.45)`, clipPath:squareClip, opacity:1},
        {transform:'translate(0, 0) scale(1)', clipPath:'inset(0% round 0px)', opacity:1},
      ], {duration:1600, easing:'cubic-bezier(.42,0,.22,1)'}));
      [...card.children].forEach(child => {
        controls.push(child.animate([
          {opacity:0, offset:0}, {opacity:0, offset:.35}, {opacity:1, offset:1},
        ], {duration:1600, easing:'ease-in-out'}));
      });
    });
    Promise.all(controls.map(control => control.finished)).then(() => setBurst(false)).catch(() => {});
    return () => controls.forEach(control => control.cancel());
  }, [visible, reducedMotion]);

  return <section className="section solutions solutions-reference" aria-labelledby="solutions-title">
    <div className="solutions-intro">
      <span className="solutions-eyebrow"><i/> CONSTRUCTION LABOUR HIRE</span>
      <h2 id="solutions-title">Construction workers<br/>for <em>your site.</em></h2>
      <p>Construction labour for builders, contractors and site managers across Melbourne and Victoria. Tell us the roles and skills your site needs.</p>
    </div>
    <div className="solutions-highlights" aria-label="Our approach">
      {highlights.map(([Icon, title, copy]) => <div className="solution-highlight" key={title}>
        <strong>{title}</strong><span className="solution-highlight-ring"><Icon size={28} strokeWidth={1.7} aria-hidden="true"/></span>
        <span className="solution-highlight-stem" aria-hidden="true"/><p>{copy}</p>
      </div>)}
    </div>
    <div ref={gridRef} className={`solution-grid${burst ? ' is-bursting' : ''}`}>
      {roles.map(({number, title, copy, Icon}) => <article className="solution" key={number}>
        <span className="solution-card-icon"><Icon size={40} strokeWidth={1.6} aria-hidden="true"/></span>
        <h3><Link className="work-role-title" to={getWorkRolePath(title)}>{title}</Link></h3>
        <p>{copy}</p>
      </article>)}
      <div className="solutions-burst-glow" aria-hidden="true"/>
    </div>
    <div className="solutions-cta"><Link className="btn orange" to="/labour-hire#roles">Explore roles <ArrowRight size={14} aria-hidden="true"/></Link></div>
  </section>;
}
