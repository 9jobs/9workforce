import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Bell, Check, Home, UploadCloud, X} from 'lucide-react';

function ApplicationReceived({onClose}) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({preventScroll: true}); }, []);
  return <main className="role-application-page application-received-page">
    <section className="application-received-card" aria-labelledby="application-received-heading">
      <button className="application-received-close" type="button" aria-label="Close confirmation" onClick={onClose}><X size={26}/></button>
      <svg className="application-received-art" viewBox="0 0 260 230" fill="none" aria-hidden="true">
        <defs><linearGradient id="received-paper" x1="74" y1="34" x2="207" y2="215" gradientUnits="userSpaceOnUse"><stop stopColor="#3678dc"/><stop offset="1" stopColor="#23509a"/></linearGradient><linearGradient id="received-fold" x1="163" y1="32" x2="196" y2="74" gradientUnits="userSpaceOnUse"><stop stopColor="#d2e7ff"/><stop offset="1" stopColor="#78b0fb"/></linearGradient></defs>
        <rect x="40" y="25" width="139" height="164" rx="18" transform="rotate(-8 40 25)" fill="#3872cc" opacity=".45"/>
        <path d="M84 35h79l38 40v120a18 18 0 0 1-18 18H84a18 18 0 0 1-18-18V53a18 18 0 0 1 18-18Z" fill="url(#received-paper)"/>
        <path d="M163 35v29a11 11 0 0 0 11 11h27l-38-40Z" fill="url(#received-fold)"/>
        <circle cx="134" cy="132" r="44" stroke="#ff9b25" strokeWidth="8"/>
        <path d="m114 133 15 15 29-31" stroke="#ff9b25" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="22" cy="71" r="10" fill="#ff9b25"/><rect x="226" y="132" width="16" height="16" rx="2" transform="rotate(45 226 132)" fill="#ff9b25"/>
        <path d="m206 18 4-13m11 24 13-11m-6 24 15-3" stroke="#ff9b25" strokeWidth="5" strokeLinecap="round"/>
      </svg>
      <span className="application-received-eyebrow">APPLICATION RECEIVED</span>
      <h1 ref={heading} tabIndex={-1} id="application-received-heading">You’ve taken the<br/>next step.</h1>
      <h2>Thank you for applying with 9Work Force.</h2>
      <p className="application-received-description">Your application has been submitted successfully.<br/>Our team will review your details and contact you<br className="received-desktop-break"/> if a suitable opportunity is available.</p>
      <div className="application-stay-connected"><Bell aria-hidden="true"/><div><h3>Stay connected</h3><p>Keep an eye on your phone and email for updates.</p></div></div>
      <Link className="btn orange application-home-link" to="/"><Home size={24} aria-hidden="true"/>Back to Home</Link>
      <Link className="application-explore-link" to="/find-work#opportunities">Explore more roles <ArrowRight size={24} aria-hidden="true"/></Link>
    </section>
  </main>;
}

const applicationMessages = [
  {eyebrow: 'YOUR NEXT CHAPTER STARTS HERE', title: 'Your future starts with you.', description: 'Every career begins with a first step. Tell us a little about yourself and take yours with 9Work Force.'},
  {eyebrow: 'YOUR SKILLS. YOUR NEXT STEP.', title: 'Build on what you bring.', description: 'Your experience, skills and commitment matter. Share what you can do so we can explore opportunities that suit you.'},
  {eyebrow: 'ONE STEP CLOSER', title: 'Let your experience open doors.', description: 'Add your resume and give our team a clearer picture of your strengths. Submit your application and take the next step towards your next opportunity.'}
];
const stageHeadings = [
  {label: 'Personal details', title: 'Let’s get to know you', description: 'Start with your contact details.'},
  {label: 'Work details', title: 'Tell us what you bring', description: 'Share your experience and availability.'},
  {label: 'Resume & submit', title: 'You’re one step closer', description: 'Add your resume and complete your application.'}
];
export default function RoleApplication({role, categories, onClose}) {
  const form = useRef(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('');
  const [resume, setResume] = useState('');
  useEffect(() => { form.current?.querySelector(`[data-step="${step}"] input, [data-step="${step}"] select`)?.focus(); }, [step]);
  async function advance(event) {
    event.preventDefault();
    if (status === 'sending') return;
    const fields = form.current.querySelectorAll(`[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`);
    for (const field of fields) if (!field.reportValidity()) return;
    if (step < 2) setStep(step + 1);
    else {
      setStatus('sending');
      try {
        const data = new FormData(form.current);
        const file = data.get('resume');
        const fields = Object.fromEntries([...data.entries()].filter(([key]) => key !== 'resume'));
        fields.preferredRole = role;
        if (file?.size) {
          if (file.size > 3 * 1024 * 1024) throw new Error('Please choose a resume smaller than 3 MB.');
          fields.resumeName = file.name;
          fields.resumeType = file.type;
          fields.resumeData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Unable to read your resume. Please choose the file again.'));
            reader.readAsDataURL(file);
          });
        }
        const response = await fetch('/api/submissions', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'contact', fields})});
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to submit your application. Please try again.');
        setStatus('success');
      } catch (error) { setStatus(error.message || 'Unable to submit your application. Please try again.'); }
    }
  }
  const success = status === 'success';
  const message = applicationMessages[step];
  if (success) return <ApplicationReceived onClose={onClose}/>;
  return <main className="role-application-page" aria-label="Candidate application">
    <div className="role-application-layout">
      <aside className="application-brand">
        <svg viewBox="346 818 1313 359" role="img" aria-label="9Work Force"><image href="/assets/9workforce-logo-white-clean.png" width="2000" height="2000"/></svg>
        <div className="application-brand-content">
        <div className="application-message" aria-live="polite" aria-atomic="true">
          <span className="application-eyebrow">{message.eyebrow}</span>
          <h2>{step === 0 ? <>Your future<br/>starts with<br/><em>you.</em></> : step === 1 ? <>Build on<br/>what you <em>bring.</em></> : <>Let your experience<br/>open <em>doors.</em></>}</h2>
          <p>{message.description}</p>
        </div>
        <div className="application-role"><small>YOU ARE APPLYING FOR</small><strong>{role}</strong></div>
        </div>
        <span className="application-brand-note">Construction opportunities across Victoria.</span>
      </aside>
      <div className="application-panel">
          <ol className="application-progress" aria-label="Application progress">{stageHeadings.map((stage,index)=><li key={stage.label} className={index===step?'current':index<step?'complete':''} aria-current={index===step?'step':undefined}><span>{index<step?<Check size={20}/>:index+1}</span><b>{stage.label}</b></li>)}</ol>
          <div className="application-stage-heading"><span>STEP {step+1} OF 3</span><h2>{stageHeadings[step].title}</h2><p>{stageHeadings[step].description}</p></div>
          <form ref={form} className="application-form" noValidate onSubmit={advance}>
            <fieldset data-step="0" hidden={step !== 0}><legend className="application-sr-only">Personal details</legend><label>Full name <i>*</i><input name="fullName" autoComplete="name" required placeholder="e.g. John Doe"/></label><label>Phone number <i>*</i><input name="phone" type="tel" autoComplete="tel" required placeholder="e.g. 0400 000 000"/></label><label>Email address <i>*</i><input name="email" type="email" autoComplete="email" required placeholder="e.g. john@example.com"/></label></fieldset>
            <fieldset data-step="1" hidden={step !== 1}><legend className="application-sr-only">Work details</legend><label>Location in Victoria<input name="location" placeholder="e.g. Melbourne CBD, Western Suburbs"/></label><div className="application-field-row"><label>Work type / category<select name="workCategory" defaultValue={role}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Availability<select name="availability"><option>Immediately</option><option>Within 2 weeks</option><option>Just exploring</option></select></label></div><label>Experience &amp; tickets<textarea name="experienceTickets" rows="4" placeholder="White Card, relevant site experience and role-specific tickets"/></label></fieldset>
            <fieldset data-step="2" hidden={step !== 2}><legend className="application-sr-only">Documents</legend><label>Upload resume / CV<span className="application-upload"><UploadCloud size={28}/><b>{resume || 'Choose your resume'}</b><small>Maximum file size: 3 MB</small><input name="resume" type="file" onChange={event => setResume(event.target.files[0]?.name || '')}/></span></label><label>Cover letter <small>(optional)</small><textarea name="coverLetter" rows="3" placeholder="Tell us why you are interested in this role"/></label><label>Message / additional information<textarea name="additionalInformation" rows="3" placeholder="Transport, tickets or anything else you would like us to know"/></label></fieldset>
            {status && status !== 'sending' && <p className="application-error" role="alert">{status}</p>}
            <div className="application-form-actions">{step > 0 && <button type="button" className="application-back" disabled={status === 'sending'} onClick={() => setStep(step - 1)}><ArrowLeft size={16}/> Back</button>}<button className="btn orange" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Submitting…' : step === 2 ? 'Submit application' : 'Continue'}<ArrowRight size={16}/></button></div>
            <p className="application-note">Registration does not guarantee employment or placement.</p>
          </form>
      </div>
    </div>
  </main>;
}
