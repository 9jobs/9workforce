import React,{useEffect,useRef,useState} from 'react';
import {Mail,LockKeyhole,Eye,EyeOff,ArrowRight,ArrowLeft,ShieldCheck,HardHat,LoaderCircle,Users,ClipboardList,BriefcaseBusiness} from 'lucide-react';
export async function api(route,method='GET',data){
 let response;
 try{response=await fetch('/api/workspace/'+route,{method,headers:{'Content-Type':'application/json','X-Workspace-Role':location.pathname.split('/')[1]||'admin'},...(data?{body:JSON.stringify(data)}:{})});}
 catch{throw new Error('Local Admin server is not reachable. Start the Admin server on port 3002, then refresh and retry. The operation has not been confirmed.');}
 let result;try{result=await response.json();}catch{throw new Error('The Admin server returned an invalid response. Refresh the page and retry.');}
 if(!response.ok)throw new Error(result.error||'Request failed.');return result;
}

export function Badge({children}){return <span className={'op-badge '+(/^(Active|Enabled|Available|Open|Assigned|Completed|Complete|Shortlisted|Workers Assigned)$/.test(children)?'positive':/Cancelled|Inactive|Suspended|Not Selected|Unavailable/.test(children)?'negative':'')}>{children}</span>}
export function Dialog({title,children,onClose,wide=false}){const ref=useRef(null);useEffect(()=>{const previous=document.activeElement;ref.current.showModal();return()=>previous?.focus?.()},[]);return <dialog ref={ref} className={'panel-dialog op-dialog '+(wide?'wide':'')} onCancel={onClose}><div className="dialog-top"><div><small>9WORKFORCE · LOCAL WORKSPACE</small><h2>{title}</h2></div><button type="button" className="dialog-close" aria-label="Close dialog" onClick={onClose}>×</button></div>{children}</dialog>}
export function Auth({setup,initialize,onInitialize,onBack,onLogin}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false);
 return <section className="op-auth auth-layout" aria-label="Administrator access">
  <aside className="auth-story">
   <div className="auth-brand"><span className="auth-brand-icon"><HardHat size={24} aria-hidden="true"/></span><span>9WORK<span>FORCE</span></span></div>
   <div className="auth-story-copy"><span className="auth-eyebrow">BUILT FOR YOUR WORKFORCE</span><h2>Your people.<br/><span>One connected<br/>workspace.</span></h2><p>Keep your team, requests and opportunities moving forward.</p></div>
   <div className="auth-story-features">{[{Icon:Users,label:'People & profiles'},{Icon:ClipboardList,label:'Workforce requests'},{Icon:BriefcaseBusiness,label:'Jobs & assignments'}].map(({Icon,label})=><div key={label}><span><Icon size={17} aria-hidden="true"/></span>{label}</div>)}</div>
   <div className="auth-story-footer"><span className="auth-brand-line"/>BETTER TEAMS. STRONGER SITES.</div>
  </aside>
  <div className="auth-form-panel">
   <div className="auth-access-icon"><ShieldCheck size={23} aria-hidden="true"/></div>
   <span className="auth-kicker">ADMINISTRATOR ACCESS</span>
   <h1>{initialize?'Create admin account':'Admin Login'}</h1>
   <p className="auth-intro">{initialize?'Set your email and password to get started.':'Welcome back. Sign in to manage your workforce.'}</p>
   <form className="auth-form" onSubmit={async e=>{
    e.preventDefault();setBusy(true);setError('');const body=Object.fromEntries(new FormData(e.currentTarget));
    try{if(initialize)await api('register','POST',{...body,name:'Administrator',role:'admin'});const result=await api('login','POST',{...body,role:'admin'});onLogin(result.user);}catch(e){setError(e.message)}finally{setBusy(false)}
   }}>
    <div className="auth-field"><label htmlFor="admin-email">Email</label><div className="auth-input-wrap"><Mail size={18} aria-hidden="true"/><input id="admin-email" name="email" type="email" required placeholder="you@company.com" autoComplete="username" spellCheck={false} autoCapitalize="none" disabled={busy}/></div></div>
    <div className="auth-field"><label htmlFor="admin-password">Password</label><div className="auth-input-wrap"><LockKeyhole size={18} aria-hidden="true"/><input id="admin-password" name="password" type={showPassword?'text':'password'} minLength={10} maxLength={128} required placeholder={initialize?'Create a strong password':'Enter your password'} autoComplete={initialize?'new-password':'current-password'} disabled={busy} aria-describedby={initialize?'admin-password-hint':undefined}/><button className="auth-password-toggle" type="button" aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18} aria-hidden="true"/>:<Eye size={18} aria-hidden="true"/>}</button></div>{initialize&&<small id="admin-password-hint">Use at least 10 characters.</small>}</div>
    {error&&<p role="alert" className="op-error auth-error">{error}</p>}
    <button className="op-primary auth-submit" disabled={busy}><span>{busy?'Please wait…':initialize?'Create admin account':'Sign in'}</span>{busy?<LoaderCircle size={18} className="auth-spinner" aria-hidden="true"/>:<ArrowRight size={18} aria-hidden="true"/>}</button>
   </form>
   {setup&&!initialize&&<div className="auth-setup-row"><span>Setting up for the first time?</span><button className="op-setup-link" type="button" onClick={onInitialize}>First-time admin setup<ArrowRight size={13} aria-hidden="true"/></button></div>}
   {initialize&&<button className="auth-back" type="button" onClick={onBack}><ArrowLeft size={14} aria-hidden="true"/>Back to login</button>}
   <div className="auth-security"><ShieldCheck size={14} aria-hidden="true"/><span>Secure access to your local workspace</span></div>
  </div>
 </section>;
}
export function AssignmentForm({data,request,application,busy,onSubmit}){const [query,setQuery]=useState(''),[workType,setWorkType]=useState(''),[location,setLocation]=useState(''),[selected,setSelected]=useState(application?[application.workerId]:[]);const job=data.jobs.find(j=>j.id===application?.jobId),rows=data.workers.filter(w=>(!application||w.id===application.workerId)&&(!workType||w.workType===workType)&&(!location||w.location===location)&&(!query||[w.name,w.location,w.workType,w.tickets,w.experience].join(' ').toLowerCase().includes(query.toLowerCase())));return <form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);onSubmit({requestId:request?.id,applicationId:application?.id,workerIds:selected,employerId:form.get('employerId')})}}><p>{request?request.position+' · '+request.location:job?.title} · Review experience, tickets and availability before assigning.</p>{!request&&!job?.employerId&&<label>Employer<select name="employerId" required><option value="">Choose employer</option>{data.employers.filter(e=>e.status==='Active').map(e=><option key={e.id} value={e.id}>{e.company}</option>)}</select></label>}<div className="op-controls"><label>Search workers<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, experience or tickets"/></label><label>Work type<select value={workType} onChange={e=>setWorkType(e.target.value)}><option value="">All</option>{[...new Set(data.workers.map(w=>w.workType).filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select></label><label>Location<select value={location} onChange={e=>setLocation(e.target.value)}><option value="">All</option>{[...new Set(data.workers.map(w=>w.location).filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="op-worker-options">{rows.map(w=><label key={w.id}><input type="checkbox" checked={selected.includes(w.id)} disabled={w.status!=='Available'||Boolean(application)} onChange={e=>setSelected(e.target.checked?[...selected,w.id]:selected.filter(id=>id!==w.id))}/><span><strong>{w.name}</strong><small>{w.workType||'Work type not provided'} · {w.location||'Location not provided'}</small><small>{w.availability||w.status} · {w.experience||'Experience not provided'} · {w.tickets||'Tickets not provided'}</small></span><Badge>{w.status}</Badge></label>)}{!rows.length&&<p>No matching workers found.</p>}</div><p>{selected.length} selected</p><button className="op-primary" disabled={busy||!selected.length}>Confirm Assignment</button></form>}
