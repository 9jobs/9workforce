import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Check,ClipboardList,HardHat,Mail,MapPin,Phone,ShieldCheck,Users} from 'lucide-react';
import {accountClient} from './accountClient';
import './hire-page.css';

const support=[
  [HardHat,'Construction labour','General and skilled labour for site preparation, materials handling and trade support.'],
  [ShieldCheck,'Site requirements first','Worker experience, relevant tickets and availability considered against your brief.'],
  [Users,'People & coordination','A workforce team to discuss your requirements and coordinate the next steps.'],
];
export default function HirePage(){
  const {data:session}=accountClient.useSession();
  return <main className="hire-page">
    <section className="hire-hero" aria-labelledby="hire-heading">
      <div className="hire-wrap hire-hero-grid">
        <div><span className="hire-eyebrow">CONSTRUCTION LABOUR HIRE · VICTORIA</span><h1 id="hire-heading">The right support.<br/><em>A stronger site.</em></h1><p>Build your team with construction labour support across Melbourne and Victoria. Tell us about your project, the people you need and when you need them.</p><div className="hire-actions"><a className="hire-primary" href="#hire-request">Request Workers <ArrowRight size={18}/></a><a className="hire-secondary" href="tel:+61422279428"><Phone size={17}/>Talk to our team</a></div><div className="hire-hero-notes"><span><Check size={15}/>Builders & contractors</span><span><MapPin size={15}/>Melbourne & Victoria</span></div></div>
        <div className="hire-hero-photo"><img src="/assets/employer-construction-hero.webp" alt="Construction team at a building site" fetchPriority="high"/><div className="hire-photo-caption"><span><HardHat size={24}/></span><div><strong>Your project. Our people.</strong><small>Construction · Civil · Trade support</small></div></div></div>
      </div>
    </section>
    <section className="hire-wrap hire-support" aria-labelledby="hire-support-heading"><div className="hire-section-intro"><span className="hire-eyebrow">BUILT AROUND YOUR SITE</span><h2 id="hire-support-heading">Practical workforce support.</h2><p>From an extra pair of hands to a project crew, start with the requirements that matter to your site.</p></div><div className="hire-support-grid">{support.map(([Icon,title,copy])=><article key={title}><span className="hire-feature-icon"><Icon size={24}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="hire-process"><div className="hire-wrap"><div className="hire-section-intro"><span className="hire-eyebrow">HOW IT WORKS</span><h2>A clear path to your next crew.</h2></div><ol>{[['Tell us what you need','Share your site location, roles, worker numbers and preferred start date.'],['We review your brief','Our team discusses site requirements and suitable worker availability.'],['Coordinate your workforce','Confirm the next steps, site details and onboarding requirements with our team.']].map(([title,copy],index)=><li key={title}><span>0{index+1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></div></section>
    <section className="hire-entry" id="hire-request" aria-labelledby="hire-request-heading"><div className="hire-wrap hire-entry-grid"><div className="hire-entry-main"><span className="hire-eyebrow">WORKFORCE REQUEST</span><h2 id="hire-request-heading">Let's build your workforce.</h2><p>Share your project requirements so our team can review the labour support you need.</p><div className="hire-signin-card"><span className="hire-feature-icon"><ClipboardList size={24}/></span><h3>{session?'Ready to tell us about your site?':'Sign in to request workers.'}</h3><p>{session?'Your account is ready. Continue to add your contact details and site requirements.':'Create an account or sign in, then complete your worker request. Your selected form will open after sign-in.'}</p><Link className="hire-primary" to="/request-workers">{session?'Open request form':'Sign in / Register'}<ArrowRight size={18}/></Link><small>No request is sent until you complete and submit the form.</small></div></div><aside className="hire-contact"><span className="hire-eyebrow">9WORKFORCE · VICTORIA</span><h2>Let's get your<br/>site moving.</h2><p>Need to discuss your requirements first? Speak with our workforce team.</p><ul><li><Mail size={20}/><a href="mailto:support@9workforce.com.au">support@9workforce.com.au</a></li><li><Phone size={20}/><a href="tel:+61422279428">+61 422 279 428</a></li><li><MapPin size={20}/><span>Melbourne, Victoria,<br/>Australia</span></li></ul><div className="hire-contact-foot"><HardHat size={24}/><span>Construction labour.<br/>Support for your next project.</span></div></aside></div></section>
  </main>;
}
