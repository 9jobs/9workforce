import PremiumDatePicker from './PremiumDatePicker';
import React, {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, HardHat, CheckCircle2, LockKeyhole, Mail, Phone, MapPin} from 'lucide-react';
import './request-workers.css';

export default function RequestWorkers() {
  const [status,setStatus]=useState('idle');
  const [error,setError]=useState('');
  const [step,setStep]=useState(1);
  const pending=useRef(false);
  async function submit(event) {
    event.preventDefault();
    if(pending.current)return;
    const form=event.currentTarget;
    if(step===1){setStep(2);return;}
    const fields=Object.fromEntries(new FormData(form));
    fields.applicationForm='workerRequest';
    pending.current=true;setStatus('sending');setError('');
    try {
      const response=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'contact',fields})});
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||'Unable to send your request. Please try again.');
      form.reset();setStatus('success');setStep(1);
    } catch(err) {setError(err.message||'Unable to send your request. Please try again.');setStatus('error');}
    finally {pending.current=false;}
  }
  return <section className="worker-request-page" aria-labelledby="worker-request-heading">
    <div className="worker-request-card">
      <div className="worker-request-body">
      <div className="worker-request-header"><div><span className="worker-request-eyebrow">REQUEST WORKERS</span><h1 id="worker-request-heading">Build your <em>workforce.</em></h1><p>Tell us what your site needs.</p></div><span className="worker-request-icon"><HardHat size={30} aria-hidden="true"/></span></div>
      {status!=='success'&&<ol className="worker-request-progress" aria-label="Request progress"><li className={step===1?'current':'complete'} aria-current={step===1?'step':undefined}><span>{step===2?<CheckCircle2 size={16} aria-hidden="true"/>:'1'}</span>Basic details</li><li className={step===2?'current':''} aria-current={step===2?'step':undefined}><span>2</span>Site requirements</li></ol>}
      {status==='success'?<div className="worker-request-success" role="status"><CheckCircle2 size={42} aria-hidden="true"/><h2>Request received.</h2><p>Our team will be in touch about your workforce needs.</p><button type="button" onClick={()=>setStatus('idle')}>SEND ANOTHER REQUEST</button></div>:<form className="worker-request-form" aria-label="Request construction workers" onSubmit={submit}>
        <fieldset className="worker-request-fields" hidden={step!==1}>
          <legend>Basic details</legend>
          <label>Name<input name="fullName" autoComplete="name" required maxLength={120} placeholder="Your full name"/></label>
          <label>Company<input name="company" autoComplete="organization" required maxLength={160} placeholder="Company name"/></label>
          <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com.au"/></label>
          <label>Mobile<input name="phone" type="tel" autoComplete="tel" required maxLength={32} placeholder="Your mobile number"/></label>
        </fieldset>
        <fieldset className="worker-request-fields" hidden={step!==2} disabled={step!==2}>
          <legend>Site requirements</legend>
          <label className="worker-request-full">Site suburb / location<input name="siteLocation" autoComplete="address-level2" required maxLength={200} placeholder="e.g. Richmond, Melbourne"/></label>
          <label>Workers required<select name="workersRequired" required defaultValue=""><option value="" disabled>Select workers</option><option>General Labourers</option><option>Skilled Labourers</option><option>Other</option></select></label>
          <label>How many workers?<input name="workerCount" type="number" min="1" max="10000" step="1" required placeholder="e.g. 4"/></label>
          <label className="worker-request-full">Start date<PremiumDatePicker name="startDate" label="Start date" required/></label>
          <label className="worker-request-full">What do you need?<textarea name="requirements" rows={3} maxLength={2000} placeholder="A short description of the work and site requirements"/></label>
        </fieldset>
        {error&&<p className="worker-request-error" role="alert">{error}</p>}
        <div className="worker-request-submit-row"><p><LockKeyhole size={14} aria-hidden="true"/><span>Your details are handled in line with our <Link to="/privacy-policy">Privacy Policy</Link>.</span></p><div className="worker-request-actions">{step===2&&<button type="button" className="worker-request-back" disabled={status==='sending'} onClick={()=>{setStep(1);setError('');}}>Back</button>}<button type="submit" disabled={status==='sending'}>{status==='sending'?'SENDING…':step===1?'CONTINUE':'GET MY WORKFORCE'}<ArrowRight size={18} aria-hidden="true"/></button></div></div>
      </form>}
      </div>
      <aside className="worker-request-side" aria-label="Workforce team contact details">
        <div className="worker-request-info">
          <span className="worker-request-info-eyebrow">9WORKFORCE · VICTORIA</span>
          <h2>Let's get your<br/><em>site moving.</em></h2>
          <p>Speak with our team about the workers you need.</p>
          <ul>
            <li><Mail size={21} aria-hidden="true"/><a href="mailto:support@9workforce.com.au">support@9workforce.com.au</a></li>
            <li><Phone size={21} aria-hidden="true"/><a href="tel:+61422279428">+61 422 279 428</a></li>
            <li><MapPin size={21} aria-hidden="true"/><span>Melbourne, Victoria,<br/>Australia</span></li>
          </ul>
          <div className="worker-request-info-foot"><HardHat size={22} aria-hidden="true"/><span>Construction labour.<br/>People you can rely on.</span></div>
        </div>
      </aside>
    </div>
  </section>;
}
