import PublishedJobs from './PublishedJobs';
import RequireAccount, {WorkerFormEntry,redirectIfSignedOut} from './RequireAccount';
import AccountPage from './AccountPage';
import {accountClient} from './accountClient';
import VictoriaAddressInput from './VictoriaAddressInput';
import {isValidEmail} from '../lib/applicationValidation';
import WorkAreasPage from './WorkAreasPage';
import PremiumDatePicker from './PremiumDatePicker';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {BrowserRouter, Routes, Route, NavLink, Link, useLocation, useParams, Navigate, useNavigate} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, Phone, PhoneCall, Mail, Menu, X, Check, ShieldCheck, Clock3, HardHat, Truck, MapPin, ChevronDown, ChevronRight, LockKeyhole, Users, DollarSign, ClipboardList, MessageCircle, Home as HomeIcon, UserRoundPlus, BookOpen} from 'lucide-react';
import {motion, MotionConfig, useReducedMotion} from 'framer-motion';
import MotionObserver from './ScrollReveals';
import './styles.css';
import './brand-tokens.css';
import HomeHero, {WorkSearchResults} from './HomeHero';
import BlogPage, {BlogArticle} from './BlogPage';
import HomeSolutions from './HomeSolutions';
import ConstructionJourney from './ConstructionJourney';
import RequestWorkers from './RequestWorkers';
import HirePage from './HirePage';
import './about-purpose.css';
import {getWorkRolePath} from './workRolePaths';
import WorkRoleDetails from './WorkRoleDetails';
import {additionalWorkRoleContent} from './workRoleContent';
import RoleApplication from './RoleApplication';
import LegalPolicies from './LegalPolicies';
import './work-role-details.css';
import './contact-page.css';
import './about-page.css';
import './about-coverage.css';
import AboutPage from './AboutPage';
import './industry-showcase.css';
import './navigation.css';
import LabourSupport from './LabourSupport';
import SiteFooter from './SiteFooter';
import WorkforceCoverage from './WorkforceCoverage';
import './buttons.css';
import './contact-studio.css';
import './worker-registration.css';
import './worker-benefits.css';
import './heading-colors.css';
import './brand-ui.css';

function VisionMission(){
  return <section className="section about-purpose" aria-label="Our vision and mission">
    <article className="about-purpose-row">
      <div className="about-purpose-copy">
        <h2>Our vision</h2>
        <p>To be a dependable construction labour partner for Victorian builders and project teams through suitable workers, clear communication and responsible site practices.</p>
        <ul><li><Check aria-hidden="true"/>Trusted construction labour hire</li><li><Check aria-hidden="true"/>Safe, respectful work</li></ul>
      </div>
      <img src={imgs.aboutVision} alt="Construction workers working together on site" loading="lazy" width="512" height="286"/>
    </article>
    <article className="about-purpose-row about-purpose-row-reverse">
      <div className="about-purpose-copy">
        <h2>Our mission</h2>
        <p>To support construction workforce needs through worker screening, practical coordination, safety awareness and fair treatment.</p>
        <ul><li><Check aria-hidden="true"/>Role and site suitability</li><li><Check aria-hidden="true"/>Clear communication and fair treatment</li></ul>
      </div>
      <img src={imgs.aboutMission} alt="Construction team reviewing project plans together" loading="lazy" width="512" height="286"/>
    </article>
  </section>;
}

const A={home:'https://www.figma.com/api/mcp/asset/cb7b79ef-0fcb-4b13-a85c-f7e26bfd7e5c', labour:'https://www.figma.com/api/mcp/asset/80233759-7b24-40b8-bd59-014a80950ea6', employers:'https://www.figma.com/api/mcp/asset/ddf22ed2-6d19-4b97-8bed-d1ae0057a721', about:'https://www.figma.com/api/mcp/asset/3e1fbf9e-1027-46a9-abcb-93cc7c56a15a'};
const imgs={logo:'/assets/9workforce-logo.webp', hero:'/assets/hero-clean-helmet-warehouse.webp', logistics:'/assets/work-logistics.webp', labourHero:'/assets/labour-site-team.webp', construction:'/assets/construction-worker.webp', trades:'/assets/traffic-control.webp', civil:'/assets/civil-excavation.webp', warehouse:'/assets/warehouse-pallets.webp', employerHero:'/assets/project-team.webp', employerLogistics:'/assets/materials-worker.webp', industryHero:'/assets/site-sunset.webp', tradeAssistant:'/assets/trade-team.webp', generalLabour:'/assets/general-labour.webp', findWorkHero:'/assets/toolbox-talk.webp', findWorkBanner:'/assets/find-work-materials.webp', aboutHero:'/assets/about-hero.webp', aboutStory:'/assets/about-story.webp', aboutVision:'/assets/about-vision-team.webp', aboutMission:'/assets/about-mission-warehouse.webp'};

const nav=[['Home','/'],['Who We Are','/who-we-are'],['Work Areas','/industries'],['Looking for work','/find-work'],['Looking for Hire','/looking-for-hire'],['Blog','/blog'],['Contact Us','/contact']];
const navIcons=[HomeIcon,Users,MapPin,UserRoundPlus,HardHat,BookOpen,Mail];
const MotionLink=motion.create(Link);
const MotionNavLink=motion.create(NavLink);
function MotionMain({children}){const reduce=useReducedMotion();return <motion.main initial={reduce?false:{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:reduce?0:.42,ease:[.22,1,.36,1]}}>{children}</motion.main>}
function MotionPage({children}){const reduce=useReducedMotion();const {pathname}=useLocation();const root=useRef(null);return <motion.div className="motion-page" key={pathname} ref={root} initial={reduce?false:{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:reduce?0:.42,ease:[.22,1,.36,1]}}><MotionObserver key={pathname} root={root}/>{children}</motion.div>}
function Header(){
  const {data:accountSession}=accountClient.useSession();
  const [open,setOpen]=useState(false);
  const {pathname}=useLocation();
  const isHomeHeader=pathname==='/';
  const isBlueHeader=(['/register','/labour-hire','/industries','/find-work','/looking-for-hire'].includes(pathname)||pathname.startsWith('/find-work/'));
  const whiteLogo=isBlueHeader||isHomeHeader;
  const logoSource=whiteLogo?'/assets/9workforce-logo-white-clean.webp':'/assets/9workforce-logo-updated.webp';
  const logoViewBox=whiteLogo?'346 818 1313 359':'546 877 911 250';
  const descriptions=['Construction labour across Victoria','Our people, purpose & approach','Construction, civil & site support','Explore construction opportunities','Find the right people for your site','Construction insights & updates','Speak with our team'];
  useEffect(()=>{
    if(!open)return;
    const closeOnEscape=event=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('keydown',closeOnEscape);
    return ()=>document.removeEventListener('keydown',closeOnEscape);
  },[open]);
  return <header className={`site-header shared-nav${isBlueHeader?' blue-header':''}${isHomeHeader?' hero-header':''}`}>
    <div className="header-inner">
      <Link className="header-logo" to="/" aria-label="9Work Force home"><svg className={`header-logo-art${whiteLogo?' light-logo':''}`} viewBox={logoViewBox} role="img" aria-label="9Work Force"><image className="header-logo-image" href={logoSource} width="2000" height="2000"/></svg></Link>
      <nav id="main-navigation" className={`nav-card${open?' open':''}`} aria-label="Main navigation">
        <div className="nav-card-heading"><div className="nav-card-brand"><svg viewBox="346 818 1313 359" role="img" aria-label="9Work Force"><image href="/assets/9workforce-logo-white-clean.webp" width="2000" height="2000"/></svg></div><div className="nav-card-dismiss"><button className="nav-card-close" type="button" aria-label="Close navigation" onClick={()=>setOpen(false)}><X size={18} aria-hidden="true"/></button></div></div>
        {nav.map(([n,p],i)=><MotionNavLink key={p} to={p} end className={({isActive})=>isActive?'active':''} onClick={()=>setOpen(false)} whileHover={{y:-1}} transition={{duration:.18}}><span className="nav-item-icon">{React.createElement(navIcons[i],{size:24,"aria-hidden":true})}</span><span className="nav-item-copy"><span>{n}</span><small className="nav-item-description">{descriptions[i]}</small></span></MotionNavLink>)}
        <div className="nav-mobile-actions"><a className="nav-call" href="tel:+61422279428" onClick={()=>setOpen(false)}><span className="nav-action-icon"><PhoneCall size={22} aria-hidden="true"/></span><span className="nav-action-copy"><strong>Call Now</strong><small>Get instant support</small></span></a><Link className="nav-register" to="/register" onClick={()=>setOpen(false)}><span className="nav-action-icon"><ArrowUpRight size={24} aria-hidden="true"/></span><span className="nav-action-copy"><strong>{accountSession?'My Account':'Register'}</strong><small>Start your journey</small></span></Link></div>
      </nav>
      <div className="header-actions"><motion.a className="phone nav-call" href="tel:+61422279428" whileHover={{y:-2}} whileTap={{scale:.98}} transition={{duration:.18}}><PhoneCall size={19} aria-hidden="true"/>Call Now</motion.a><MotionLink className="phone nav-register" to="/register" whileHover={{y:-2}} whileTap={{scale:.98}} transition={{duration:.18}}><UserRoundPlus size={17} aria-hidden="true"/>{accountSession?'My Account':'Register'}</MotionLink><motion.button className="menu-btn" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)} whileTap={{scale:.94}} transition={{duration:.15}}>{open?<X/>:<Menu/>}</motion.button></div>
    </div>
  </header>;
}
function WhatsAppIcon(){return <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.004 2a9.91 9.91 0 0 0-8.411 15.14L2 22l4.999-1.58A9.91 9.91 0 1 0 12.004 2m0 18.16a8.24 8.24 0 0 1-4.204-1.153l-.301-.18-2.968.938.965-2.892-.197-.313a8.24 8.24 0 1 1 6.705 3.6"/></svg>}
function InstagramIcon(){return <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2m0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6m5.25-3.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5"/></svg>}
function Footer(){return <SiteFooter whatsAppIcon={<WhatsAppIcon/>} instagramIcon={<InstagramIcon/>}/>;}
const Btn=({children,to='/request-workers',light=false})=><MotionLink className={'btn '+(light?'light':'orange')} to={to} whileHover={{y:-2}} whileTap={{scale:.98}} transition={{duration:.18}}>{children}<ArrowRight size={14}/></MotionLink>;
function Badge(){return null}
function Home(){return <><Header/><main><HomeHero/><ConstructionJourney/><Solutions/><Industries/><How/><WorkforceCoverage/><SplitCTA/><Footer/></main></>}
function Metrics(){return <div className="metrics"><div><b>VIC</b><span>Victoria Based</span></div><div><b>WHS</b><span>Safety Focused</span></div><div><b>SKILLS</b><span>Experience &amp; Tickets</span></div></div>}
function Trust(){return <div className="trust">{[['⚡','Active Opportunities'],['◷','Flexible Work'],['✓','Work-Ready People'],['⌖','Victoria-Based Projects'],['♧','Safety & WHS Focused']].map(x=><span key={x[1]}><i>{x[0]}</i>{x[1]}</span>)}</div>}
const solutionData=[
  {number:'01',title:'General Construction Labourers',copy:'Labourers supporting materials handling, site preparation, clean-up and general construction tasks.',image:imgs.construction,Icon:HardHat},
  {number:'02',title:'Skilled Construction Labourers',copy:'Experienced labourers supporting specialised site tasks within their skills and role requirements.',image:imgs.civil,Icon:HardHat},
  {number:'03',title:'Trade Assistants',copy:'Workers assisting qualified tradespeople with tools, materials, preparation and site activities within their role.',image:imgs.trades,Icon:ShieldCheck},
  {number:'04',title:'Civil Construction Labourers',copy:'Workers supporting site preparation, excavation support, drainage, roadworks and infrastructure projects.',image:imgs.warehouse,Icon:ClipboardList}
];
function Solutions(){return <HomeSolutions roles={solutionData}/>;}
function Industries(){const [openArea,setOpenArea]=useState(null);const areas=['General Labourers','Skilled Labourers','Trade Assistants','Civil Labourers','Formwork & Concrete Labourers','High-Risk Licensed Workers','Site Support Workers','Rail & Infrastructure Labourers'];const descriptions=['Workers supporting materials handling, site preparation, clean-up and general construction tasks under site direction.','Experienced labourers supporting specialised construction tasks, tools and equipment within their demonstrated skills, training and site requirements.','Workers assisting qualified tradespeople with tools, materials, work-area preparation and practical tasks within their training and supervision.','Labourers supporting site preparation, drainage, roadworks, excavation support and civil infrastructure tasks according to experience and project requirements.','Workers assisting with formwork preparation, handling components and concrete-related site tasks within their experience, training and supervision.','Workers holding relevant high-risk work licences for assigned tasks, with competencies, authorisations and site requirements reviewed for each role.','Workers helping with site organisation, materials movement, logistics, housekeeping and day-to-day support for construction crews.','Labourers supporting rail and infrastructure crews with site preparation, materials and general project tasks, subject to relevant experience, competencies and inductions.'];return <LabourSupport areas={areas} descriptions={descriptions} openArea={openArea} setOpenArea={setOpenArea}/>;}
function How(){return <section className="section how"><motion.div initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.2}} transition={{duration:.55}}><Badge>HOW IT WORKS</Badge><h2>Labour hire for your project.</h2><p>Tell us the roles, location and start date you need support with. We review suitable workers and coordinate site arrangements with your team.</p></motion.div><div className="steps">{[['01','Share site requirements','Share the roles, location, start date, hours and credentials your site requires.'],['02','Review suitable workers','We review construction experience, work rights, White Cards and relevant role credentials.'],['03','Coordinate site arrangements','We coordinate onboarding, induction information and worker communication with your site team.']].map((x,i)=><motion.article key={x[0]} initial={{opacity:0,x:i%2?28:-28}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.2}} transition={{duration:.55,delay:i*.1,ease:[.22,1,.36,1]}} whileHover={{y:-4}}><b>{x[0]}</b><h3>{x[1]}</h3><p>{x[2]}</p></motion.article>)}</div><div className="process-cta"><Btn to="/find-work#register">Register for work</Btn></div></section>}
function SplitCTA(){return <section className="split-cta"><div><Badge>WORK WITH US</Badge><h2>Ready to start <em>construction work?</em></h2><p>Join our workforce network across Melbourne and Victoria. Tell us about your experience, White Card, tickets and preferred work locations.</p></div><div><Badge>REGISTER YOUR DETAILS</Badge><h2>Build your <em>worker profile.</em></h2><p>Share your skills, licences, availability and job preferences so we can match you with suitable construction opportunities. Registration does not guarantee placement.</p></div><div className="split-cta-action"><Btn to="/find-work#register">Register for Work</Btn></div></section>}

function PageHero({title,accent,desc,image,children}){const reduce=useReducedMotion();return <section className="page-hero"><div><Badge>9WORK FORCE • VICTORIA OPERATIONS</Badge><h1>{title}<br/><em>{accent}</em></h1><p>{desc}</p>{children}</div>{image&&<motion.img src={image} initial={reduce?false:{opacity:0,scale:1.03}} whileInView={{opacity:1,scale:1}} viewport={{once:true,amount:.2}} transition={{duration:reduce?0:.75,ease:[.22,1,.36,1]}}/>}</section>}
function Labour(){return <><Header/><main><PageHero title="Construction labour supply." accent="Melbourne and Victoria." desc="General and skilled labourers, trade assistants and civil support for builders, contractors and construction project teams." image={imgs.labourHero}><div className="hero-buttons"><Btn to="/find-work#opportunities">Find Work</Btn><Btn light to="/find-work#register">Apply for Work</Btn></div><Metrics/></PageHero><section id="roles" className="section disciplines"><Badge>CONSTRUCTION LABOUR ROLES</Badge><h2>Labour matched to<br/><em>your site requirements.</em></h2><p>Explore the construction roles we supply. Experience, tickets, availability and site requirements guide worker suitability.</p><LabourCards/></section><Workflow/><SplitCTA/><Footer/></main></>}
function Compliance(){return <div className="compliance"><div><ShieldCheck/><b>Operational &amp; Employment Standards</b><span>We operate in accordance with applicable Victorian employment, workplace safety and business requirements.</span></div>{['ABN & BUSINESS REGISTRATION','WORKCOVER & INSURANCE','WHS & SAFETY PROCEDURES','PAYROLL, PAYG & SUPER'].map(x=><span key={x}><Check size={14}/>{x}</span>)}</div>}
const labourCards=[['General Construction Labourers','Workers supporting material handling, site preparation, site clean-up and general construction duties.',imgs.construction],['Skilled Construction Labourers','Experienced labourers supporting specialised site activities according to skills and role requirements.',imgs.employerLogistics],['Trade Assistants','Workers assisting qualified tradespeople with tools, materials, preparation and site activities within their role.',imgs.tradeAssistant],['Civil Construction Labourers','Workers supporting site preparation, excavation support, drainage, roadworks and infrastructure projects.',imgs.civil],['Formwork & Concrete Labourers','Workers assisting with formwork preparation, concrete-related activities and structural construction support.','/assets/role-formwork-concrete.webp'],['Traffic Management Workers','Suitably trained workers supporting traffic-management activities on construction, civil and infrastructure sites according to qualifications and host-site requirements.',imgs.trades]];
function LabourCards(){return <div className="labour-cards">{labourCards.map((x,i)=><motion.article key={x[0]} initial={{opacity:0,x:i%2?28:-28}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.16}} transition={{duration:.58,delay:i*.08,ease:[.22,1,.36,1]}} whileHover={{y:-4}}><div><Badge>0{i+1} / WORK ROLE</Badge><h3><Link className="work-role-title" to={getWorkRolePath(x[0])}>{x[0]}</Link></h3><p>{x[1]}</p><ul><li><Check/> Work-ready workers</li><li><Check/> Safety focused</li></ul><Link to={`${getWorkRolePath(x[0])}/apply`}>Apply for this role <ArrowRight size={12}/></Link></div><motion.img src={x[2]} initial={{opacity:0,scale:1.04}} whileInView={{opacity:1,scale:1}} viewport={{once:true,amount:.2}} transition={{duration:.7,delay:i*.08}}/></motion.article>)}</div>}
function Workflow(){return <section className="section workflow"><Badge>CONSTRUCTION LABOUR HIRE PROCESS</Badge><h2>Practical workforce coordination</h2><p>We support your workforce requirements through recruitment, credential checks, onboarding and site coordination.</p><div className="workflow-grid">{[['01','Recruitment & screening','We review experience, qualifications, tickets and availability against the roles your site needs.'],['02','Onboarding & verification','We check White Cards, licences, work rights and required safety inductions before work starts.'],['03','Attendance & site coordination','Our team coordinates daily attendance, timesheets and site communication during placements.'],['04','Payroll & safety compliance','We manage wages, superannuation, WorkCover and internal WHS requirements.']].map(x=><article key={x[0]}><b>{x[0]}</b><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div></section>}

async function submitLeadForm(event, type, setStatus){event.preventDefault();setStatus('sending');const form=event.currentTarget;const fields=Object.fromEntries(new FormData(form).entries());try{const response=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,fields})});if(redirectIfSignedOut(response))return;const raw=await response.text();let result={};try{result=raw?JSON.parse(raw):{}}catch{throw new Error('Form server returned an invalid response. Please restart the app with npm run dev.')}if(!response.ok)throw new Error(result.error||'Unable to send');form.reset();setStatus(result.message||'Thanks — your details have been sent.')}catch(error){setStatus(error.message||'Unable to send the form right now. Please try again.')}}
function FormStatusPopup({message,onClose}){useEffect(()=>{if(!message||message==='sending')return;const timer=window.setTimeout(onClose,5000);return()=>window.clearTimeout(timer)},[message,onClose]);if(!message||message==='sending')return null;const isError=/unable|invalid|required|failed|error/i.test(message);return createPortal(<div className={`form-status-popup${isError?' error':''}`} role="status" aria-live="polite"><span>{message}</span><button type="button" onClick={onClose} aria-label="Close message">×</button></div>,document.body)}
function RequestForm(){
  const [status,setStatus]=useState('');
  const validateEmail=event=>{const field=event.currentTarget;field.setCustomValidity(field.value&&!isValidEmail(field.value)?'Enter a valid email address, e.g. name@example.com.':'');};
  return <RequireAccount redirect={false} target="/find-work#register"><form className="request-form" aria-label="Worker application" onSubmit={e=>submitLeadForm(e,'employer',setStatus)}>
    <input type="hidden" name="applicationForm" value="joinTeam"/>
    <div className="form-head"><b>Join Our Team</b><span>WORKER APPLICATION</span></div><p className="hire-form-intro">Share your details for suitable construction work opportunities.</p>
    <label>What type of work are you interested in? *<select name="workType" required defaultValue="General Construction Labourers"><option>General Construction Labourers</option><option>Skilled Construction Labourers</option><option>Trade Assistants</option><option>Civil Construction Labourers</option><option>Formwork &amp; Concrete Labourers</option><option>Traffic Management Workers</option></select></label>
    <div className="form-row"><label>Years of experience *<input name="yearsExperience" required type="number" min="0" step="1" placeholder="e.g. 2"/></label><label>Available start date *<PremiumDatePicker name="availableStartDate" label="Available start date" required/></label></div>
    <VictoriaAddressInput name="preferredLocation" label="Preferred location in Victoria *" required/>
    <label>Your email address *<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required onChange={validateEmail} onBlur={validateEmail}/></label>
    <button className="btn orange" type="submit" disabled={status==='sending'}>{status==='sending'?'SENDING...':'SUBMIT APPLICATION'} <ArrowRight size={16}/></button>
    <p className="hire-form-note"><LockKeyhole size={12} aria-hidden="true"/><span>Learn how we handle your details in our <Link to="/privacy-policy">Privacy Policy</Link>.</span></p><FormStatusPopup message={status} onClose={()=>setStatus('')}/>
  </form></RequireAccount>;
}
function RequestSection(){return <section className="request-section"><div><Badge>WORKER RECRUITMENT TEAM</Badge><h2>Ready to work on<br/><em>our Victorian projects?</em></h2><p>Register your details, experience and availability today. Our recruitment team reviews applications for suitable opportunities.</p><Btn to="/find-work#register">Apply for Work</Btn></div><div className="contact-card"><Phone/><b>Worker Enquiries</b><span>Recruitment &amp; Operations Support<br/>Victoria, Australia</span></div></section>}

function WhoWeAre(){return <><Header/><AboutPage footer={<Footer/>}/></>}
const industryItems=[['FORMWORK & CONCRETE LABOURERS','Labourers assisting with formwork preparation, concrete-related tasks and structural construction support.',imgs.construction],['TRAFFIC MANAGEMENT WORKERS','Suitably trained workers supporting traffic-management activities according to qualifications, competencies, inductions and host-site requirements.',imgs.trades],['PLANT & EQUIPMENT OPERATORS','Suitably experienced and appropriately qualified workers operating relevant construction plant and equipment for the role and site.','/assets/role-plant-operator.webp'],['HIGH-RISK LICENSED WORKERS','Workers with relevant high-risk work licences for roles where specific licences, competencies and site requirements apply.','/assets/role-licensed-equipment.webp'],['CONSTRUCTION SITE SUPPORT WORKERS','Workers supporting site organisation, materials movement, logistics and day-to-day assistance for construction crews.',imgs.logistics],['RAIL & INFRASTRUCTURE LABOURERS','Workers supporting rail, civil and infrastructure projects according to competencies, inductions, experience and project requirements.',imgs.employerHero]];
const industryCardIcons=[HardHat,ShieldCheck,Truck,ClipboardList,Users,MapPin];

function IndustryShowcase(){return <section className="work-area-showcase" aria-labelledby="work-area-showcase-title"><div className="work-area-showcase-inner">
  <div className="work-area-showcase-heading"><div><span className="work-area-eyebrow">WORK AREAS / VICTORIA</span><h2 id="work-area-showcase-title">Construction labour hire <br/>across&nbsp;<em>Victoria.</em></h2></div><div className="work-area-heading-note"><p>Explore six work areas, with worker suitability reviewed against relevant experience, credentials and site requirements.</p><span><i aria-hidden="true"/>06 WORK AREAS</span></div></div>
  <div className="work-area-photo-grid">{industryItems.map(([title,description,photo],index)=>{const Icon=industryCardIcons[index];const displayTitle=title.toLowerCase().replace(/\b\w/g,letter=>letter.toUpperCase());return <article className="work-area-photo-card" key={title}>
    <div className="work-area-card-media"><img src={photo} alt={displayTitle+' on a construction project'} loading="lazy" width="1672" height="941"/></div>
    <div className="work-area-card-copy"><div className="work-area-card-meta"><span className="work-area-card-index">0{index+1}<small> / WORK AREA</small></span><span className="work-area-card-icon"><Icon size={22} aria-hidden="true"/></span></div><h3>{displayTitle}</h3><p>{description}</p><Link className="work-area-card-link" to={getWorkRolePath(title)}><span>Apply for this work</span><span className="work-area-link-arrow"><ArrowRight size={18} aria-hidden="true"/></span></Link></div>
  </article>})}</div>
</div></section>}
function IndustriesPage(){return <><Header/><WorkAreasPage items={industryItems} icons={industryCardIcons} getRolePath={getWorkRolePath}/><Footer/></>}

const workAreas=['General Construction Labourers','Skilled Construction Labourers','Trade Assistants','Civil Construction Labourers','Formwork & Concrete Labourers','Traffic Management Workers'];
const findWorkRoleNotes=['White Card and relevant site experience','Relevant experience and role credentials','Tools, materials and site-support experience','Experience and tickets vary by project','Formwork or concrete experience where required','Qualifications, competencies and host-site requirements'];
function FindWorkRoleList(){return <><PublishedJobs/><section className="find-work-register-banner"><div className="find-work-register-copy"><span className="find-work-register-brand">9Work Force <i>VICTORIA</i></span><h2>Take the next step towards <em>labour-hire work.</em></h2><p>Share your experience, tickets and availability so our recruitment team can consider you for suitable Victorian project roles.</p><ul><li><Check size={15}/> Add your experience and preferred role</li><li><Check size={15}/> Share your tickets and availability</li><li><Check size={15}/> We review your details against project requirements</li></ul><a className="find-work-register-button" href="#register">Register for Construction Work <ArrowRight size={14}/></a></div><img src={imgs.findWorkBanner} alt="Construction worker on site"/></section></>}
const findWorkBenefits=[
  ['Victorian Projects','Construction, civil and site-support opportunities across Victoria, subject to project requirements.',MapPin],
  ['Proper Entitlements','Managed payroll, superannuation and statutory entitlements under applicable awards.',DollarSign],
  ['Safety Focused','Site inductions, WHS requirements and practical coordination to support safe work.',ShieldCheck],
  ['Simple Registration','Share your construction skills, experience and availability through the registration process.',ClipboardList]
];
function WorkerBenefitsSection(){return <section className="section worker-benefits"><Badge>JOINING OUR CONSTRUCTION WORKFORCE</Badge><h2>Construction work. <em>Practical support.</em></h2><div className="benefit-grid">{findWorkBenefits.map(([title,description,Icon],i)=><motion.article key={title} initial={{opacity:0,x:i%2?28:-28}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.18}} transition={{duration:.52,delay:i*.08}} whileHover={{y:-4}}><span className="worker-benefit-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><Icon aria-hidden="true"/><h3>{title}</h3><p>{description}</p>{i<findWorkBenefits.length-1&&<span className="worker-benefit-connector" aria-hidden="true"><ChevronRight size={16}/></span>}</motion.article>)}</div></section>}
function FindWork(){return <><Header/><main><section className="worker-hero"><div><Badge>CONSTRUCTION WORK • VICTORIA</Badge><h1>Looking for <em>construction work?</em></h1><p>If you are seeking construction work in Victoria, register your experience, White Card, tickets, availability and preferred location.</p><div className="hero-buttons"><Btn to="#register">Register for Construction Work</Btn><Btn light to="#opportunities">Explore Opportunities</Btn></div></div><motion.img src={imgs.findWorkHero} initial={{opacity:0,x:36,scale:1.03}} whileInView={{opacity:1,x:0,scale:1}} viewport={{once:true,amount:.2}} transition={{duration:.75,ease:[.22,1,.36,1]}}/></section><section id="opportunities" className="section work-opportunities"><motion.div className="find-work-heading" initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.2}} transition={{duration:.55}}><Badge>WORK OPPORTUNITIES</Badge><h2>Construction labour roles <em>in Victoria.</em></h2><p>Explore construction roles across Victoria. Suitability depends on your experience, credentials, availability and site requirements.</p></motion.div><FindWorkRoleList/></section><WorkerBenefitsSection/><section className="section timeline"><Badge>HOW IT WORKS</Badge><h2>Getting started with <em>9Work Force.</em></h2><div className="timeline-row">{[['01','Share details, experience & availability'],['02','Experience & tickets review'],['03','Induction & briefing'],['04','Start work if selected']].map((x,i)=><motion.article key={x[0]} initial={{opacity:0,x:i%2?28:-28}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.2}} transition={{duration:.5,delay:i*.1}}><b>{x[0]}</b><span>{x[1]}</span></motion.article>)}</div></section><WorkerRegistration/><section className="find-work-footer-cta"><h2>Ready for your next <em>work opportunity?</em></h2><Btn to="#register">Register for Construction Work</Btn></section><Footer/></main></>}
function WorkRolePage({application=false}){
  const {roleSlug}=useParams();
  const {search}=useLocation();
  const preferredLocation=new URLSearchParams(search).get('location')?.trim() || '';
  const locationSearch=preferredLocation?`?${new URLSearchParams({location:preferredLocation})}`:'';
  const navigate=useNavigate();
  const index=labourCards.findIndex(role=>getWorkRolePath(role[0])===`/find-work/${roleSlug}`);
  const workArea=industryItems.find(item=>getWorkRolePath(item[0])===`/find-work/${roleSlug}`);
  if(index===-1&&!workArea)return <Navigate to="/find-work#opportunities" replace/>;
  const role=index>=0?labourCards[index]:[workArea[0].toLowerCase().replace(/\b\w/g,letter=>letter.toUpperCase()),workArea[1],workArea[2]];
  if(application)return <RequireAccount><RoleApplication key={roleSlug} role={role[0]} categories={workAreas.includes(role[0])?workAreas:[...workAreas,role[0]]} preferredLocation={preferredLocation} onClose={()=>navigate(`${getWorkRolePath(role[0])}${locationSearch}`)}/></RequireAccount>;
  return <MotionPage key={roleSlug}><Header/><main><WorkRoleDetails role={role} index={index} contentOverride={additionalWorkRoleContent[roleSlug]} preferredLocation={preferredLocation} onApply={()=>navigate(`${getWorkRolePath(role[0])}/apply${locationSearch}`)}/><Footer/></main></MotionPage>;
}
function WorkerRegistration(){return <section id="register" className="registration worker-registration"><div className="worker-registration-card"><div className="worker-registration-body"><div className="worker-registration-heading"><span>WORKER REGISTRATION</span><h2>Register for <em>construction work.</em></h2><p>Register your construction experience, White Card, work rights, tickets, availability and preferred locations. Registration does not guarantee employment or placement.</p></div><WorkerForm/></div><aside className="worker-registration-side" aria-label="Registration team contact details"><div className="worker-registration-info"><span>9WORKFORCE · VICTORIA</span><h3>Your next step<br/><em>starts here.</em></h3><p>Speak with our team about registering for construction work.</p><ul><li><Mail size={21} aria-hidden="true"/><a href="mailto:support@9workforce.com.au">support@9workforce.com.au</a></li><li><Phone size={21} aria-hidden="true"/><a href="tel:+61422279428">+61 422 279 428</a></li><li><MapPin size={21} aria-hidden="true"/><span>Melbourne, Victoria,<br/>Australia</span></li></ul><div className="worker-registration-info-foot"><HardHat size={22} aria-hidden="true"/><span>Construction work.<br/>A team ready to help.</span></div></div></aside></div></section>}
async function submitWorkerRegistration(event, setStatus){
  event.preventDefault();
  const form=event.currentTarget;
  setStatus('sending');
  try {
    const data=new FormData(form);
    const fields=Object.fromEntries([...data.entries()].filter(([key])=>!['resume','coverLetter'].includes(key)));
    fields.applicationForm='workerRegistration';
    const files=['resume','coverLetter'].map(name=>[name,data.get(name)]);
    if(files.reduce((total,[,file])=>total+(file?.size||0),0)>3*1024*1024)throw new Error('Please keep the combined resume and cover letter size within 3 MB.');
    for(const [name,file] of files){
      if(!file?.size)continue;
      fields[name+'Name']=file.name;
      fields[name+'Type']=file.type;
      fields[name+'Data']=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read your file. Please choose it again.'));reader.readAsDataURL(file)});
    }
    const response=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'contact',fields})});
    if(redirectIfSignedOut(response))return;
    const result=await response.json();
    if(!response.ok||!result.ok)throw new Error(result.error||'Unable to submit your registration. Please try again.');
    form.reset();
    setStatus('Thanks — your registration has been submitted.');
  }catch(error){setStatus(error.message||'Unable to submit your registration. Please try again.')}
}
function WorkerForm({role}){const [status,setStatus]=useState('');return <RequireAccount redirect={false} target="/find-work#register"><form className={`worker-form${role?' role-candidate-form':''}`} onSubmit={e=>submitWorkerRegistration(e,setStatus)}>
  {role && <div className="role-candidate-form-heading"><h3>Candidate Registration Form</h3><p>Please provide accurate information for experience and ticket verification.</p></div>}
  <div className="form-row"><label>Full Name{role && <i aria-hidden="true"> *</i>}<input name="fullName" required placeholder={role?'e.g. John Doe':undefined}/></label><label>Phone Number{role && <i aria-hidden="true"> *</i>}<input name="phone" type="tel" required placeholder={role?'e.g. 0400 000 000':undefined}/></label></div>
  <div className="form-row"><label>Email Address{role && <i aria-hidden="true"> *</i>}<input name="email" required type="email" placeholder={role?'e.g. john@example.com':undefined}/></label><label>Location in Victoria<input name="location" placeholder={role?'e.g. Melbourne CBD, Western Suburbs':undefined}/></label></div>
  <div className="form-row"><label>Work Type / Category<select name="workCategory" defaultValue={role || "Construction Labour"}>{role ? workAreas.map(x=><option key={x}>{x}</option>) : <><option>Construction Labour</option>{workAreas.slice(1).map(x=><option key={x}>{x}</option>)}</>}</select></label><label>Availability<select name="availability"><option>Immediately</option><option>Within 2 weeks</option><option>Just exploring</option></select></label></div>
  <label>Experience &amp; Tickets<textarea name="experienceTickets" rows="3" placeholder={role?'e.g. White Card, relevant site experience and role-specific tickets':undefined}/></label>
  <div className={!role?'form-row worker-registration-documents':undefined}><label className={role?'role-resume-upload':undefined}>Upload Resume / CV{role && <span className="role-resume-prompt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M7 17H5a4 4 0 0 1-.6-7.95A7 7 0 0 1 18 8a4.5 4.5 0 0 1 .5 9H17M12 12v9m-3-6 3-3 3 3"/></svg><b>Click to upload your resume</b><small>Choose a file from your device</small></span>}<input type="file" name="resume"/></label>{!role&&<label>Upload Cover Letter <small>(optional)</small><input type="file" name="coverLetter"/></label>}</div>
  <label>Message / Additional Information<textarea name="additionalInformation" rows="3" placeholder={role?'Share details about your relevant site experience, transport, or specific tickets...':undefined}/></label>
  <button className="btn orange" type="submit" disabled={status==='sending'}>{status==='sending'?'SUBMITTING…':'REGISTER FOR WORK'} <ArrowRight size={14}/></button>
  {role && <p className="role-candidate-form-note">Registration does not guarantee employment or placement.</p>}
<FormStatusPopup message={status} onClose={()=>setStatus('')}/></form></RequireAccount>;}

function Contact(){
  return <>
    <Header/>
    <main className="contact-page-wrap contact-studio-page">
      <section className="contact-studio" aria-labelledby="contact-studio-title">
        <div className="contact-studio-accent" aria-hidden="true"/>
        <div className="contact-studio-form">
          <span className="contact-studio-eyebrow">LET’S TALK</span>
          <h1 id="contact-studio-title">Contact us<span>.</span></h1>
          <p className="contact-studio-intro">Tell us how we can help. For site labour or recruitment enquiries, send our team a message.</p>
          <ContactForm/>
        </div>
        <aside className="contact-studio-info" aria-labelledby="contact-info-title">
          <span className="contact-studio-square" aria-hidden="true"/>
          <h2 id="contact-info-title">Contact info</h2>
          <p className="contact-studio-info-intro">Talk to our team about your labour needs, experience or availability.</p>
          <div className="contact-studio-details">
            <a href="mailto:support@9workforce.com.au"><Mail size={22} aria-hidden="true"/><span><strong>Email Support</strong><span>support@9workforce.com.au</span><small>Discuss site labour or recruitment</small></span></a>
            <a href="tel:+61422279428"><Phone size={22} aria-hidden="true"/><span><strong>Labour &amp; recruitment</strong><span>+61 422 279 428</span><small>Speak with our team</small></span></a>
            <div><MapPin size={23} aria-hidden="true"/><span><strong>Victoria Operations</strong><span>Melbourne, Victoria, Australia</span><small>Supporting projects across VIC</small></span></div>
          </div>
          <span className="contact-studio-location">MELBOURNE &amp; VICTORIA</span>
        </aside>
      </section>
      <Footer/>
    </main>
  </>;
}

function ContactForm(){
  const [status,setStatus]=useState('');
  return <form className="contact-studio-fields" aria-label="Contact enquiry" onSubmit={e=>submitLeadForm(e,'contact',setStatus)}>
    <input type="hidden" name="applicationForm" value="contactEnquiry"/>
    <label htmlFor="contact-name">Name<input id="contact-name" name="fullName" autoComplete="name" required maxLength={120} placeholder="Your full name"/></label>
    <label htmlFor="contact-email">Email<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></label>
    <label htmlFor="contact-phone">Phone<input id="contact-phone" name="phone" type="tel" autoComplete="tel" required maxLength={32} placeholder="Your phone number"/></label>
    <label htmlFor="contact-message">Message<textarea id="contact-message" name="message" rows={3} required maxLength={4000} placeholder="How can we help?"/></label>
    <button className="contact-submit-btn" type="submit" disabled={status==='sending'}>{status==='sending'?'SENDING…':'SEND MESSAGE'} <ArrowRight size={16} aria-hidden="true"/></button>
    <FormStatusPopup message={status} onClose={()=>setStatus('')}/>
  </form>;
}
function App(){return <Routes><Route path="/register" element={<MotionPage><Header/><AccountPage/><Footer/></MotionPage>}/><Route path="/" element={<MotionPage><Home/></MotionPage>}/><Route path="/work-search" element={<MotionPage><Header/><main><WorkSearchResults roles={labourCards} notes={findWorkRoleNotes}/><Footer/></main></MotionPage>}/><Route path="/labour-hire" element={<MotionPage><Labour/></MotionPage>}/><Route path="/employers" element={<Navigate to="/" replace/>}/><Route path="/who-we-are" element={<MotionPage><WhoWeAre/></MotionPage>}/><Route path="/about" element={<MotionPage><WhoWeAre/></MotionPage>}/><Route path="/industries" element={<MotionPage><IndustriesPage/></MotionPage>}/><Route path="/find-work" element={<MotionPage><WorkerFormEntry><FindWork/></WorkerFormEntry></MotionPage>}/><Route path="/find-work/:roleSlug" element={<MotionPage><WorkRolePage/></MotionPage>}/><Route path="/find-work/:roleSlug/apply" element={<MotionPage><WorkRolePage application/></MotionPage>}/><Route path="/looking-for-hire" element={<MotionPage><Header/><HirePage/><Footer/></MotionPage>}/><Route path="/request-workers" element={<MotionPage><Header/><main><RequireAccount><RequestWorkers/></RequireAccount></main><Footer/></MotionPage>}/><Route path="/blog" element={<MotionPage><Header/><BlogPage/><Footer/></MotionPage>}/><Route path="/blog/:slug" element={<MotionPage><Header/><BlogArticle/><Footer/></MotionPage>}/><Route path="/contact" element={<MotionPage><Contact/></MotionPage>}/><Route path="/modern-slavery" element={<MotionPage><Header/><main><LegalPolicies initialTab="modern-slavery"/></main><Footer/></MotionPage>}/><Route path="/modern-slavery-statement" element={<MotionPage><Header/><main><LegalPolicies initialTab="modern-slavery"/></main><Footer/></MotionPage>}/><Route path="/privacy-policy" element={<MotionPage><Header/><main><LegalPolicies initialTab="privacy"/></main><Footer/></MotionPage>}/><Route path="/workcover-terms" element={<MotionPage><Header/><main><LegalPolicies initialTab="workcover"/></main><Footer/></MotionPage>}/><Route path="/legal" element={<MotionPage><Header/><main><LegalPolicies/></main><Footer/></MotionPage>}/></Routes>}
function ScrollToRoute(){
  const {pathname,search,hash}=useLocation();
  useLayoutEffect(()=>{
    const previous=window.history.scrollRestoration;
    window.history.scrollRestoration='manual';
    return()=>{window.history.scrollRestoration=previous};
  },[]);
  useLayoutEffect(()=>{
    if(hash){
      const frame=requestAnimationFrame(()=>document.getElementById(hash.slice(1))?.scrollIntoView({behavior:'instant',block:'start'}));
      return()=>cancelAnimationFrame(frame);
    }
    else{window.scrollTo({top:0,left:0,behavior:'instant'})}
  },[pathname,search,hash]);
  return null;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><MotionConfig reducedMotion="user"><ScrollToRoute/><App/></MotionConfig></BrowserRouter>);
