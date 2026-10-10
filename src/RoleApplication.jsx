import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check, Home, UploadCloud} from 'lucide-react';
import {isAustralianPhone, isValidEmail} from '../lib/applicationValidation';
import VictoriaAddressInput from './VictoriaAddressInput';

function CelebrationBurst() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3600);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div className="application-celebration" aria-hidden="true">{Array.from({length: 72}, (_, index) => {
    const angle = (index / 72) * Math.PI * 2;
    const distance = 180 + (index % 7) * 34;
    return <span key={index} className={index % 6 === 0 ? 'celebration-ribbon' : 'celebration-confetti'} style={{
      '--burst-x': `${Math.cos(angle) * distance}px`,
      '--burst-y': `${Math.sin(angle) * distance - 100}px`,
      '--fall-y': `${180 + (index % 5) * 45}px`,
      '--spin': `${(index % 2 ? 1 : -1) * (360 + index * 23)}deg`,
      '--delay': `${(index % 8) * 35}ms`,
      '--confetti-color': ['var(--orange)', '#ffd166', '#7eb9ff', '#ffffff', '#58d6bc'][index % 5]
    }}/>;
  })}</div>;
}

function ApplicationReceived() {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({preventScroll: true}); }, []);
  return <main className="role-application-page application-received-page">
    <CelebrationBurst/>
    <section className="application-received-card" aria-labelledby="application-received-heading">
      <h1 ref={heading} tabIndex={-1} id="application-received-heading">Congratulation</h1>
      <p className="application-received-description">Your application has been submitted successfully.</p>
      <Link className="btn orange application-home-link" to="/"><Home size={20} aria-hidden="true"/>Back to Home</Link>
    </section>
  </main>;
}

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
  const [coverLetter, setCoverLetter] = useState('');
  useEffect(() => { form.current?.querySelector(`[data-step="${step}"] input, [data-step="${step}"] select`)?.focus(); }, [step]);
  function validateContactField(field) {
    const value = field.value.trim();
    if (field.name === 'phone') field.setCustomValidity(value && !isAustralianPhone(value) ? 'Enter a valid Australian mobile or landline number, e.g. 0412 345 678 or +61 412 345 678.' : '');
    if (field.name === 'email') field.setCustomValidity(value && !isValidEmail(value) ? 'Enter a valid email address, e.g. name@example.com.' : '');
  }
  async function advance(event) {
    event.preventDefault();
    if (status === 'sending') return;
    form.current.querySelectorAll('[name=phone], [name=email]').forEach(validateContactField);
    const fields = form.current.querySelectorAll(`[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`);
    for (const field of fields) if (!field.reportValidity()) return;
    if (step < 2) setStep(step + 1);
    else {
      // Recheck required fields from every stage before making a submission.
      for (const field of form.current.querySelectorAll('input, select, textarea')) {
        if (!field.checkValidity()) {
          setStep(Number(field.closest('[data-step]').dataset.step));
          requestAnimationFrame(() => field.reportValidity());
          return;
        }
      }
      setStatus('sending');
      try {
        const data = new FormData(form.current);
        const fields = Object.fromEntries([...data.entries()].filter(([key]) => !['resume', 'coverLetter'].includes(key)));
        fields.email = fields.email.trim();
        fields.phone = fields.phone.trim();
        fields.preferredRole = role;
        fields.applicationForm = 'roleApplication';
        const attachments = [['resume', data.get('resume')], ['coverLetter', data.get('coverLetter')]];
        if (!attachments[0][1]?.size) throw new Error('Please upload your resume / CV.');
        if (attachments.reduce((total, [, file]) => total + (file?.size || 0), 0) > 3 * 1024 * 1024) {
          throw new Error('Please keep the combined resume and cover letter size within 3 MB.');
        }
        for (const [name, file] of attachments) {
          if (!file?.size) continue;
          fields[`${name}Name`] = file.name;
          fields[`${name}Type`] = file.type;
          fields[`${name}Data`] = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Unable to read your file. Please choose it again.'));
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
  if (success) return <ApplicationReceived onClose={onClose}/>;
  return <main className="role-application-page application-simple-page" aria-label="Candidate application">
    <div className="role-application-layout">
          <ol className="application-progress" aria-label="Application progress">{stageHeadings.map((stage,index)=><li key={stage.label} className={index===step?'current':index<step?'complete':''} aria-current={index===step?'step':undefined}><span>{index<step?<Check size={20}/>:index+1}</span><b>{stage.label}</b></li>)}</ol>
      <aside className="application-brand">
        <img className="application-footer-logo" src="/assets/9workforce-footer-logo.png" alt="9Work Force"/>
        <p className="application-brand-tagline" aria-live="polite" aria-atomic="true">{['Your future starts with you.', 'YOUR SKILLS. YOUR NEXT STEP.', 'ONE STEP CLOSER'][step]}</p>
      </aside>
      <div className="application-panel">
          <div className="application-stage-heading"><span>STEP {step+1} OF 3</span><h2>{stageHeadings[step].title}</h2><p>{stageHeadings[step].description}</p></div>
          <form ref={form} className="application-form" noValidate onSubmit={advance}>
            <fieldset data-step="0" hidden={step !== 0}><legend className="application-sr-only">Personal details</legend><label>Full name <i>*</i><input name="fullName" autoComplete="name" required placeholder="e.g. John Doe"/></label><label>Phone number <i>*</i><input name="phone" type="tel" autoComplete="tel" required maxLength={32} onChange={event => validateContactField(event.target)} placeholder="e.g. 0412 345 678 or +61 412 345 678"/></label><label>Email address <i>*</i><input name="email" type="email" autoComplete="email" required maxLength={254} onChange={event => validateContactField(event.target)} placeholder="e.g. john@example.com"/></label></fieldset>
            <fieldset data-step="1" hidden={step !== 1}><legend className="application-sr-only">Work details</legend><VictoriaAddressInput/><div className="application-field-row"><label>Work type / category<select name="workCategory" defaultValue={role}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Availability<select name="availability"><option>Immediately</option><option>Within 2 weeks</option><option>After 2 weeks</option><option>Just exploring</option></select></label></div><label>Experience &amp; tickets<textarea name="experienceTickets" rows="4" placeholder="White Card, relevant site experience and role-specific tickets"/></label></fieldset>
            <fieldset data-step="2" hidden={step !== 2}><legend className="application-sr-only">Documents</legend><label>Upload resume / CV <i>*</i><span className="application-upload"><UploadCloud size={28}/><b>{resume || 'Upload resume / CV'}</b><small>Click to upload · Combined limit: 3 MB</small><input name="resume" type="file" required onChange={event => setResume(event.target.files[0]?.name || '')}/></span></label><label>Cover letter <small>(optional)</small><span className="application-upload"><UploadCloud size={28}/><b>{coverLetter || 'Upload cover letter'}</b><small>Click to upload · Combined limit: 3 MB</small><input name="coverLetter" type="file" onChange={event => setCoverLetter(event.target.files[0]?.name || '')}/></span></label><label>Message / additional information<textarea name="additionalInformation" rows="3" placeholder="Transport, tickets or anything else you would like us to know"/></label></fieldset>
            {status && status !== 'sending' && <p className="application-error" role="alert">{status}</p>}
            <div className="application-form-actions">{step > 0 && <button type="button" className="application-back" disabled={status === 'sending'} onClick={() => setStep(step - 1)}><ArrowLeft size={16}/> Back</button>}<button className="btn orange" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Submitting…' : step === 2 ? 'Submit application' : 'Continue'}<ArrowRight size={16}/></button></div>
          </form>
      </div>
    </div>
  </main>;
}
