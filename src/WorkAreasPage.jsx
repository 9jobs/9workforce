import React, {useRef, useEffect} from 'react';

import {Link} from 'react-router-dom';
import {motion, useReducedMotion} from 'framer-motion';

import {ArrowRight, ArrowLeft, Check, MapPin, HardHat, ShieldCheck, MessageCircle} from 'lucide-react';

import './work-areas-redesign.css';



const roleDescriptions=[

  'Workers supporting formwork preparation, concrete placement, reinforcement handling and general concrete construction tasks.',

  'Workers supporting construction traffic control, site access and traffic management activities, subject to relevant training and accreditation.',

  'Operators for excavators, loaders, forklifts and other construction equipment, subject to relevant licences and competencies.',

  'Workers with relevant high-risk work licences for tasks involving dogging, rigging, elevated work platforms and other regulated activities.',

  'General site support for material handling, deliveries, housekeeping, site preparation and assisting trades.',

  'Workers supporting suitable rail, roadworks, utilities and infrastructure construction activities.'

];

const regions=['Melbourne CBD & inner suburbs','Northern & western Melbourne','Eastern & south-eastern Melbourne','Geelong & Surrounding Areas','Ballarat & Bendigo','Regional Victoria & Gippsland'];

export default function WorkAreasPage({items,icons,getRolePath}){

  useEffect(()=>{

    const previousTitle=document.title;

    const meta=document.querySelector('meta[name="description"]');

    const previousDescription=meta?.getAttribute('content');

    document.title='Construction Labour Hire Melbourne & Victoria | 9 Work Force';

    meta?.setAttribute('content','Explore construction labour hire services across Melbourne and Victoria. 9 Work Force focuses on general, skilled, civil and specialist construction labour requirements.');

    return ()=>{document.title=previousTitle;if(meta&&previousDescription!==null)meta.setAttribute('content',previousDescription);};

  },[]);

  const reduceMotion=useReducedMotion();
  const servicesRef=useRef(null);

  const moveServices=(direction)=>{const track=servicesRef.current; const card=track?.firstElementChild;if(card)track.scrollBy({left:direction*(card.getBoundingClientRect().width+22),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};

  return <main className="wa-page">

    <section className="wa-hero">

      <div className="wa-wrap wa-hero-grid"><div><span className="wa-kicker">CONSTRUCTION LABOUR HIRE | VICTORIA</span><h1>Construction labour hire<br/><em>across Victoria.</em></h1><p>Construction labour hire support for builders, contractors and project teams across Melbourne and Victoria. Connecting site requirements with suitable construction workers.</p><div className="wa-actions"><Link className="wa-button" to="/request-workers">Request Workers <ArrowRight size={18}/></Link><a className="wa-outline" href="#victoria-coverage">Explore locations <MapPin size={17}/></a></div></div></div>

    </section>

    <section className="wa-wrap wa-intro">

      <div><span className="wa-kicker">LOCAL CONSTRUCTION WORKFORCE</span><h2>Supporting construction projects<br/><em>across Melbourne.</em></h2><p>9 Work Force focuses on construction labour hire for commercial building, civil works and infrastructure projects. We consider worker experience, relevant tickets, availability and site requirements to support suitable workforce matching.</p><ul>{['Construction-Focused Labour Hire','Worker Skills & Credentials','Melbourne & Victorian Projects','Site-Specific Workforce Requirements'].map(text=><li key={text}><Check size={18}/>{text}</li>)}</ul><Link className="wa-button" to="/request-workers">Work with our team <ArrowRight size={18}/></Link></div>

      <div className="wa-collage"><img src="/assets/general-labour.webp" alt="Construction labourer on a Victorian site" loading="lazy"/><img src="/assets/work-logistics.webp" alt="Construction materials and delivery coordination" loading="lazy"/><img src="/assets/project-team.webp" alt="Team planning construction work" loading="lazy"/><img src="/assets/role-plant-operator.webp" alt="Plant operator preparing construction equipment" loading="lazy"/></div>

    </section>

    <section className="wa-services" id="construction-work-areas"><div className="wa-wrap"><div className="wa-section-heading"><div><span className="wa-kicker">CONSTRUCTION LABOUR CATEGORIES</span><h2>The right workers for<br/><em>your site requirements.</em></h2></div><p>From general labouring to specialised site support, we focus on suitable workers for different construction tasks and project requirements.</p></div><div className="wa-service-grid" ref={servicesRef} tabIndex="0" aria-label="Construction work areas">{items.map(([title,description],index)=>{const Icon=icons[index];const name=title.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());return <article className="wa-service" key={title}><div className="wa-service-top"><Icon size={29}/><span>0{index+1}</span></div><h3>{name}</h3><p>{roleDescriptions[index] ?? description}</p><Link to={getRolePath(title)}>Explore this work <ArrowRight size={18}/></Link></article>})}</div><div className="wa-slider-controls"><button type="button" aria-label="Previous work areas" onClick={()=>moveServices(-1)}><ArrowLeft size={17}/></button><button type="button" aria-label="Next work areas" onClick={()=>moveServices(1)}><ArrowRight size={17}/></button></div></div></section>

    <section className="wa-wrap wa-assurance"><motion.div initial={reduceMotion?false:{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} transition={{duration:.55}}><span className="wa-kicker">OUR APPROACH</span><h2>Construction labour support<br/><em>from the first enquiry.</em></h2><p>Every construction site has different workforce requirements. We focus on understanding the work, reviewing suitable worker experience and coordinating site-related requirements.</p></motion.div><div className="wa-assurance-cards">{[[ShieldCheck,'Understanding Your Site','We review the required roles, location, tasks, worker experience and project schedule.'],[MessageCircle,'Worker Suitability & Safety','We consider relevant White Cards, licences, tickets and site induction requirements before work arrangements are confirmed.']].map(([Icon,title,copy],index)=><motion.article key={title} initial={reduceMotion?false:{opacity:0,y:42,scale:.88}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,amount:.25}} transition={{type:"spring",stiffness:150,damping:19,delay:index*.12}} whileHover={reduceMotion?undefined:{y:-7,scale:1.015}}><span><Icon size={26}/></span><h3>{title}</h3><div className="wa-short-rule"/><p>{copy}</p></motion.article>)}</div></section>

    <section className="wa-projects"><div className="wa-wrap"><div className="wa-section-heading"><div><span className="wa-kicker">CONSTRUCTION PROJECT AREAS</span><h2>Labour hire support for<br/><em>different construction projects.</em></h2><p>Construction workforce requirements vary across building sites, civil works and specialist projects. Our focus is matching worker capabilities with the needs of each site.</p></div><Link className="wa-button" to="/request-workers">Build your team <ArrowRight size={17}/></Link></div><div className="wa-project-grid">{[['/assets/employer-construction-hero.webp','MELBOURNE','Building & construction','Labour requirements for residential, commercial and building construction projects, including general labouring, formwork, concrete and trade support.','/request-workers'],['/assets/civil-excavation.webp','VICTORIA','Civil & infrastructure','Site-based labour requirements for roadworks, drainage, utilities, groundworks and other infrastructure construction activities.','/request-workers'],['/assets/traffic-control.webp','SITE SUPPORT','Specialist work areas','Workers for plant operations, high-risk tasks and specialised construction support, subject to relevant qualifications and site requirements.','#construction-work-areas']].map(([photo,tag,title,copy,to])=><article key={title}><img src={photo} alt={title+' worksite'} loading="lazy"/><div><span>{tag}</span><h3>{title}</h3><p>{copy}</p>{to.startsWith('#')?<a href={to}>Explore work areas <ArrowRight size={16}/></a>:<Link to={to}>Discuss your project <ArrowRight size={16}/></Link>}</div></article>)}</div></div></section>

    <section className="wa-wrap wa-coverage" id="victoria-coverage"><div><span className="wa-kicker">OUR GEOGRAPHIC FOCUS</span><h2>Melbourne at heart.<br/><em>Victoria in focus.</em></h2><p>Our Melbourne and Victorian construction focus supports workforce enquiries from builders and contractors across metropolitan and regional project locations.</p><div className="wa-regions">{regions.map(region=><span key={region}><MapPin size={17}/>{region}</span>)}</div><small>Melbourne metro enquiries cover the CBD and surrounding suburbs. Geelong and regional enquiries, including Ballarat, Bendigo and Gippsland, are subject to worker availability and service capability.</small><Link className="wa-button" to="/request-workers">Tell us your site location <ArrowRight size={18}/></Link></div><div className="wa-map"><div className="wa-map-title"><span><MapPin size={19}/> VICTORIA, AUSTRALIA</span><a href="https://www.google.com/maps/search/?api=1&query=Victoria%2C%20Australia" target="_blank" rel="noreferrer">Open map ↗</a></div><iframe title="Google Map of Victoria, Australia" referrerPolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Victoria%2C%20Australia&z=6&output=embed" loading="lazy"/><div className="wa-map-caption"><b>Melbourne & surrounding regions</b><span>Construction · Civil · Infrastructure</span></div></div></section>

    <section className="wa-wrap wa-final"><div><span className="wa-kicker">CONSTRUCTION LABOUR ENQUIRIES</span><h2>Need construction workers<br/><em>for your next project?</em></h2><p>Tell us about your site, the roles you need and your preferred start date. We'll review your workforce requirements and discuss the next steps.</p></div><div className="wa-actions"><Link className="btn orange" to="/request-workers">Request Workers <ArrowRight size={18}/></Link><Link className="btn light" to="/find-work#register">Register for Work <ArrowRight size={18}/></Link></div></section>

  </main>;

}

