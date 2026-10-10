import React, {useEffect, useRef, useState} from 'react';
import {useInView, useReducedMotion} from 'framer-motion';
import {Link} from 'react-router-dom';
import {ArrowRight, CircleCheck, ShieldCheck, HardHat, Clock3, Users, ClipboardList, MapPin, Check, Zap, CalendarDays, PhoneCall} from 'lucide-react';
import {australiaStates} from './coverageMapData';

const operations = [
  ['Share Your Labour Needs', 'Builders and companies tell us the roles, number of labourers, site location, start date and duration of work they need.', ClipboardList],
  ['We Recruit & Verify', 'We recruit suitable labourers and review experience, work rights, White Cards, licences and tickets against your site requirements.', ShieldCheck],
  ['We Supply & Support', 'We coordinate site-ready labourers for your project and manage worker communication, timesheets, payroll and superannuation.', Users],
];
const coordination = [
  ['Business Manager', 'Oversees business operations, client requirements and overall workforce coordination.', ClipboardList],
  ['Recruitment Officer', 'Supports worker recruitment, screening and role matching for construction labour requirements.', Users],
  ['Compliance Officer', 'Supports worker documentation, licences, tickets, safety requirements and compliance records.', ShieldCheck],
  ['Site Coordinator', 'Supports attendance, worker communication and site-related coordination during placements.', MapPin],
];

function CoverageNumber({value, suffix, active, reducedMotion}) {
  const [number, setNumber] = useState(value);
  useEffect(() => {
    if (reducedMotion || !active) return;
    let frame;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / 1400, 1);
      setNumber(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reducedMotion, value]);
  return <strong aria-label={`${value}${suffix}`}><span aria-hidden="true">{number}{suffix}</span></strong>;
}

function CoordinationCards() {
  const gridRef = useRef(null);
  const visible = useInView(gridRef, {once:true, amount:.3});
  const reducedMotion = useReducedMotion();
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!visible || reducedMotion || !gridRef.current) return;
    const grid = gridRef.current;
    const cards = [...grid.querySelectorAll('article')];
    const controls = [];
    setBurst(true);
    cards.forEach((card, index) => {
      const originX = grid.clientWidth / 2 - card.offsetLeft - card.offsetWidth / 2;
      const originY = grid.clientHeight / 2 - card.offsetTop - card.offsetHeight / 2;
      const squareSize = Math.min(card.offsetWidth, card.offsetHeight) * .84;
      const squareClip = `inset(${(card.offsetHeight - squareSize) / 2}px ${(card.offsetWidth - squareSize) / 2}px round 0px)`;
      const compactX = originX + (index % 2 ? 12 : -12);
      const compactY = originY + (index < 2 ? -12 : 12);
      controls.push(card.animate([
        {offset:0, transform:`translate(${compactX}px, ${compactY}px) scale(.45)`, clipPath:squareClip, opacity:1},
        {offset:1, transform:'translate(0, 0) scale(1)', clipPath:'inset(0% round 0px)', opacity:1},
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

  return <div ref={gridRef} className={`about-coordination-grid${burst ? ' is-bursting' : ''}`}>
    {coordination.map(([title,description,Icon]) => <article key={title}><Icon size={28} aria-hidden="true"/><h3>{title}</h3><p>{description}</p><span aria-hidden="true"><ArrowRight size={18}/></span></article>)}
    <div className="about-coordination-burst" aria-hidden="true"/>
  </div>;
}

export default function AboutPage({footer}) {
  const coverageRef = useRef(null);
  const coverageVisible = useInView(coverageRef, {once:true, amount:.25});
  const reducedMotion = useReducedMotion();
  return <main className="about-page-wrap">
    <section className="about-brand-hero" aria-labelledby="about-title">
      <div className="about-brand-hero-inner">
        <div className="about-brand-copy">
          <h1 id="about-title"><span className="about-brand-title-label">WHO WE ARE</span><br/><em>9WORK FORCE</em></h1>
          <p>A construction labour hire company built by people who understand construction - created to solve the reliability gap builders and contractors keep facing.</p>
          <div className="about-brand-stripes" aria-hidden="true"/>

        </div>
        <svg className="about-brand-photo" viewBox="1050 0 1053 578" role="img" aria-label="Three construction workers reviewing plans at a building site" preserveAspectRatio="xMidYMid slice">
          <defs><clipPath id="about-reference-photo"><path d="M 1270 0 H 2045 L 1955 256 L 2000 274 L 1970 390 L 1939 539 Q 1926 578 1885 578 H 1087 Q 1049 578 1064 535 L 1230 50 Q 1248 0 1270 0 Z"/></clipPath></defs>
          <image href="/assets/about-hero-reference.png" width="2103" height="748" clipPath="url(#about-reference-photo)"/>
        </svg>
        <div className="about-brand-dots" aria-hidden="true"/>
        <div className="about-brand-facts" aria-label="Our focus">
          {[[Users,'Reliable People','Pre-screened, job-ready workers'],[ShieldCheck,'Safety First','WHS compliant workforce'],[MapPin,'Victoria Wide','Melbourne & regional support'],[HardHat,'Construction Focus','People for every stage of your project']].map(([Icon,title,description])=><div key={title}><span className="about-brand-fact-icon"><Icon size={30} strokeWidth={1.8} aria-hidden="true"/></span><div><strong>{title}</strong><span>{description}</span></div></div>)}
        </div>
      </div>
    </section>

    <section className="about-company-story" aria-labelledby="about-company-story-title">
      <div className="about-company-story-inner">
        <div className="about-company-story-copy">
          <h2 id="about-company-story-title" className="about-story-label">Our story</h2>
          <ul className="about-company-story-points" lang="en">
          <li><CircleCheck size={21} strokeWidth={1.8} aria-hidden="true"/><p>9Work Force is a construction-focused workforce partner built for Victorian worksites - where reliability, safety, compliance and the right people on site matter every day.</p></li>
          <li><CircleCheck size={21} strokeWidth={1.8} aria-hidden="true"/><p>We are an ASIC-registered business name operated by 9 JOBS PTY. LTD. Our operating framework is built around the Labour Hire Licensing Act 2018 (Vic), Victorian workplace laws, occupational health and safety requirements, workers’ compensation obligations and modern award standards.</p></li>
          <li><CircleCheck size={21} strokeWidth={1.8} aria-hidden="true"/><p>Behind every placement is a structured process - worker verification, right-to-work checks, licences and tickets, site-specific safety requirements, compliant payroll, superannuation and ongoing workforce monitoring.</p></li>
          <li><CircleCheck size={21} strokeWidth={1.8} aria-hidden="true"/><p>We also maintain Victorian WorkCover insurance and $10 million Public &amp; Products Liability cover. We’re building a workforce company construction businesses can depend on - on site, on time and accountable.</p></li>
          </ul>
        </div>
        <div className="about-story-difference-wrap">
          <div className="about-story-difference">
            <h3 className="about-story-label">What sets 9Work Force apart</h3>
            <div className="about-story-difference-list">
              {[
                [Users, 'Reliability First', 'Dependable workers who show up ready'],
                [HardHat, 'Safety & Compliance', 'WHS focus, checks and site-ready standards'],
                [ClipboardList, 'Verified Workforce', 'Right-to-work, licences and ticket verification'],
                [ShieldCheck, 'Accountable Operations', 'Compliant payroll, super and ongoing monitoring'],
              ].map(([Icon,title,description])=><article key={title}><span className="about-story-difference-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true"/></span><div><h4>{title}</h4><p>{description}</p></div></article>)}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="about-workflow" aria-labelledby="about-operations-title">
      <div className="about-workflow-inner">
        <div className="about-workflow-heading"><span className="about-workflow-eyebrow">How we work</span><h2 id="about-operations-title">The right workforce,<br/><em>matched to</em> your project.</h2><p>From a few extra hands to a full construction crew, we help builders and companies across Melbourne and Victoria find suitable labourers for their sites.</p></div>
        <ol className="about-workflow-steps">{operations.map(([title,description,Icon],i)=><li key={title}><span className="about-workflow-icon"><Icon size={28} strokeWidth={1.8} aria-hidden="true"/></span><span className="about-workflow-number" aria-hidden="true">0{i+1}</span><h3>{title}</h3><p>{description}</p><span className="about-workflow-underline" aria-hidden="true"/>{i<operations.length-1&&<span className="about-workflow-connector" aria-hidden="true"><ArrowRight size={21}/></span>}</li>)}</ol>
      </div>
    </section>

    <section ref={coverageRef} className={`about-service-coverage${coverageVisible ? ' is-visible' : ''}`} aria-labelledby="about-project-title">
      <svg className="about-coverage-art" viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="about-coverage-ribbon"><stop stopColor="#235b9a" stopOpacity=".4"/><stop offset="1" stopColor="#174773" stopOpacity=".08"/></linearGradient><linearGradient id="about-coverage-dot-colour"><stop stopColor="#1c5e9d" stopOpacity=".05"/><stop offset=".7" stopColor="#527bac"/><stop offset="1" stopColor="#ff9d35"/></linearGradient><pattern id="about-coverage-dot-pattern" width="21" height="20" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.7" fill="white"/></pattern><mask id="about-coverage-dot-mask"><rect width="1672" height="941" fill="url(#about-coverage-dot-pattern)"/></mask></defs>
        <path d="M1073 0H1148L1321 174H1245Z M0 468L310 777H630L795 941H698L536 777H135L0 642Z M1672 737V807L1537 941H1466Z" fill="url(#about-coverage-ribbon)"/>
        <path d="M1073 0L1245 174 M0 576L78 655 M135 777H537L699 941" fill="none" stroke="#ff9b30" strokeWidth="1.4"/>
        <path d="M0 718H72L135 777 M537 777H630L795 941 M1672 737L1466 941" fill="none" stroke="#2967a5" strokeWidth=".8"/>
        <g mask="url(#about-coverage-dot-mask)"><rect x="1295" y="44" width="325" height="98" fill="url(#about-coverage-dot-colour)"/><rect x="70" y="666" width="330" height="80" fill="url(#about-coverage-dot-colour)"/><rect x="1160" y="795" width="365" height="84" fill="url(#about-coverage-dot-colour)"/></g>
      </svg>
      <div className="about-service-coverage-inner">
        <div className="about-service-coverage-copy"><span className="about-coverage-eyebrow">Where we work</span><h2 id="about-project-title">Across<br/><em>Melbourne &amp; Victoria</em></h2><p>We supply general and skilled construction labourers to builders, contractors and companies across Melbourne and Victoria. From a few extra hands to a full crew, we recruit, verify and coordinate suitable workers for your site requirements.</p></div>
        <div className="about-coverage-dashboard">
          <article className="about-coverage-turnaround"><span className="about-coverage-round-icon"><Zap size={32} strokeWidth={1.7} aria-hidden="true"/></span><CoverageNumber value={24} suffix="hr" active={coverageVisible} reducedMotion={reducedMotion}/><span className="about-coverage-caption">Typical turnaround</span><svg className="about-coverage-clock" viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="112" fill="none" stroke="currentColor" strokeWidth="5"/>{Array.from({length:12},(_,i)=><line key={i} x1="120" y1="22" x2="120" y2="33" stroke="currentColor" strokeWidth="3" transform={`rotate(${i*30} 120 120)`}/>)}<path d="M96 72L120 120L163 134" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><circle cx="120" cy="120" r="4" fill="currentColor"/></svg></article>
          <article className="about-coverage-certification"><span className="about-coverage-cert-icon" aria-hidden="true"><ShieldCheck size={59} strokeWidth={1.4}/><HardHat size={27}/></span><div><CoverageNumber value={100} suffix="%" active={coverageVisible} reducedMotion={reducedMotion}/><span className="about-coverage-caption">White Card certified</span></div></article>
          <article className="about-coverage-location"><div><span className="about-coverage-round-icon"><MapPin size={27} aria-hidden="true"/></span><strong>Melbourne &amp; Victoria</strong><span className="about-coverage-caption">Coverage area</span></div><svg className="about-coverage-vic-map" viewBox="395 340 145 95" role="img" aria-label="Victoria coverage map"><path d={australiaStates.find(state=>state.name==='Victoria').path}/><circle className="about-coverage-map-ring" cx="462" cy="399" r="16"/><circle className="about-coverage-map-ring" cx="462" cy="399" r="10"/><circle className="about-coverage-map-pin" cx="462" cy="399" r="3"/><circle className="about-coverage-map-pin" cx="435" cy="403" r="2"/><circle className="about-coverage-map-pin" cx="490" cy="390" r="2"/></svg></article>
          <article className="about-coverage-availability"><CalendarDays size={47} strokeWidth={1.5} aria-hidden="true"/><div><CoverageNumber value={7} suffix=" days" active={coverageVisible} reducedMotion={reducedMotion}/><span className="about-coverage-caption">On call every week</span></div></article>
        </div>
      </div>
    </section>

    <section className="about-coordination-section" aria-labelledby="about-coordination-title">
      <div className="about-section-heading"><span className="about-kicker">THE TEAM BEHIND YOUR TEAM</span><h2 id="about-coordination-title">Workforce coordination.</h2><p>From the first conversation to day-to-day site support, our team keeps people and project requirements connected.</p></div>
      <div className="about-coordination-scene"><img src="/assets/about-vision-team.png" alt="Team discussing construction plans" loading="lazy"/><CoordinationCards/></div>
    </section>

    <section className="about-quote-section" aria-labelledby="about-quote-title">
      <div className="about-quote-content">
        <span className="about-quote-stripes" aria-hidden="true"/>
        <h2 id="about-quote-title">Get in touch for a <em>quote today.</em></h2>
        <p>Tell us the labourers, site location and start date you need. From a few extra hands to a full crew, our team is ready to help with your next project.</p>
        <div className="about-quote-actions">
          <a className="about-quote-call" href="tel:+61422279428"><PhoneCall size={19} aria-hidden="true"/>Call 0422 279 428</a>
          <Link className="about-quote-request" to="/request-workers">Request Workers<ArrowRight size={19} aria-hidden="true"/></Link>
        </div>
      </div>
    </section>

    {footer}
  </main>;
}
