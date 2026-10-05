import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, MapPin, BriefcaseBusiness, DollarSign, ClipboardList, ShieldCheck, Check, CircleDot} from 'lucide-react';
import {workRoleContent} from './workRoleContent';

export default function WorkRoleDetails({role, index, children, onApply}) {
  const content = workRoleContent[index];
  return <>
    <section className="work-role-hero" aria-labelledby="work-role-heading">
      <div className="work-role-hero-inner">
        <div className="work-role-hero-grid">
          <div className="work-role-hero-copy">
            <span className="work-role-eyebrow"><i/>{content.category}</span>
            <h1 id="work-role-heading">{role[0]}</h1>
            <p>{content.intro}</p>
            <div className="work-role-summary">
              <div><span className="work-role-meta-icon"><MapPin aria-hidden="true"/></span><span><small>LOCATION</small><b>Victoria</b></span></div>
              <div><span className="work-role-meta-icon"><BriefcaseBusiness aria-hidden="true"/></span><span><small>CONTRACT</small><b>Labour-hire role</b></span></div>
              <div><span className="work-role-meta-icon"><DollarSign aria-hidden="true"/></span><span><small>REMUNERATION</small><b>Pay confirmed per role</b></span></div>
            </div>
            <div className="work-role-actions">
              <button className="btn orange" type="button" onClick={onApply}>Apply for this role <ArrowRight size={14}/></button>
              <Link className="work-role-secondary" to="/find-work#opportunities">View all roles <ArrowRight size={14}/></Link>
            </div>
          </div>
          <figure className="work-role-photo">
            <img src={content.image} alt={role[0]}/>
            <figcaption><span><CircleDot size={12} aria-hidden="true"/>{content.imageLabel}</span><span>Victorian Projects</span></figcaption>
          </figure>
        </div>
      </div>
    </section>
    <section className="work-role-overview" aria-labelledby="work-role-overview-heading">
      <div className="work-role-overview-heading">
        <h2 id="work-role-overview-heading">Role Overview &amp; Specifications</h2>
        <p>Explore the day-to-day responsibilities, experience and site requirements for this role.</p>
      </div>
      <div className="work-role-details">
        <article className="work-role-detail-card">
          <div className="work-role-card-heading"><span><ClipboardList aria-hidden="true"/></span><h3>About This Role</h3></div>
          <p>{content.overview}</p>
          <h4>KEY RESPONSIBILITIES INCLUDE:</h4>
          <ul className="work-role-duty-list">{content.duties.map(duty=><li key={duty}><Check aria-hidden="true"/><span>{duty}</span></li>)}</ul>
        </article>
        <article className="work-role-detail-card">
          <div className="work-role-card-heading"><span><ShieldCheck aria-hidden="true"/></span><h3>Experience &amp; Requirements</h3></div>
          <p>{content.requirementIntro}</p>
          <h4>ROLE REQUIREMENTS:</h4>
          <ul className="work-role-requirement-list">{content.requirements.map(([title,description])=><li key={title}><Check aria-hidden="true"/><span><strong>{title}</strong> — {description}</span></li>)}</ul>
        </article>
      </div>
    </section>
    <section id="register" className="work-role-registration">
      <div className="work-role-registration-inner">
        <div className="work-role-registration-copy">
          <span className="work-role-registration-eyebrow">CANDIDATE REGISTRATION</span>
          <h2>Apply for {role[0]}.</h2>
          <p>Complete the registration form with your current contact details, location in Victoria and relevant experience for {role[0].toLowerCase()} roles. Include your tickets and availability so our construction recruitment team can review your suitability for project requirements.</p>
        </div>
          <div className="work-role-placement">
            <h3><ShieldCheck size={15} aria-hidden="true"/>SITE PLACEMENT STANDARD</h3>
            <dl>
              <div><dt>Site credentials:</dt><dd>{index===5?'Traffic qualifications & White Card':'White Card & relevant tickets'}</dd></div>
              <div><dt>Primary territory:</dt><dd>Victoria (Metro &amp; Regional)</dd></div>
              <div><dt>Engagement type:</dt><dd>Labour-hire opportunity</dd></div>
            </dl>
            <p><i/>Role suitability is reviewed against project requirements.</p>
          </div>
        <div className="work-role-apply-card"><h3>Ready to apply?</h3><p>Share your details in three simple steps and our team can review your application.</p><button className="btn orange" type="button" onClick={onApply}>Apply for this role <ArrowRight size={16}/></button></div>
      </div>
    </section>
    {children}
  </>;
}
