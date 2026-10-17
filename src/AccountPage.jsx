import React, {useState} from 'react';
import {Link, Navigate, useSearchParams} from 'react-router-dom';
import {safeAccountNext} from '../lib/accountNext';
import {ArrowRight, Eye, EyeOff, LogOut, HardHat, Users, KeyRound, CircleCheck, LockKeyhole} from 'lucide-react';
import {accountClient} from './accountClient';
import './account.css';
import AccountConstruction from './AccountConstruction';

function GoogleIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59A5.99 5.99 0 0 1 12 5.96Z"/></svg>}

function AccountWelcome(){
  const [leaving,setLeaving]=useState(false);
  const [error,setError]=useState('');
  async function signOut(){
    setLeaving(true);setError('');
    try{const result=await accountClient.signOut();if(result.error)setError('Could not sign out. Please try again.');}
    catch{setError('Could not sign out. Please try again.');}
    finally{setLeaving(false);}
  }
  return <div className="account-welcome">
    <span className="account-signed-in"><i/>You’re signed in</span>
    <h2>Choose your next step.</h2>
    <p>Looking for work or hiring for your site? Get started below.</p>
    <div className="account-choices">
      <Link className="account-choice" to="/find-work#register"><span className="account-choice-icon"><HardHat size={22}/></span><span><strong>Register for Work</strong><small>Share your skills and availability.</small></span><ArrowRight size={17}/></Link>
      <Link className="account-choice" to="/request-workers"><span className="account-choice-icon"><Users size={22}/></span><span><strong>Request Workers</strong><small>Find labour support for your site.</small></span><ArrowRight size={17}/></Link>
    </div>
    {error&&<p className="account-error" role="alert">{error}</p>}
    <div className="account-welcome-footer"><Link to="/contact">Need a hand?</Link><button type="button" disabled={leaving} onClick={signOut}><LogOut size={14}/>{leaving?'Signing out…':'Sign out'}</button></div>
  </div>;
}

export default function AccountPage(){
  const [params]=useSearchParams();
  const [login,setLogin]=useState(()=>params.get('mode')==='signin');
  const {data:session,isPending}=accountClient.useSession();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [visible,setVisible]=useState(false);
  const [notice,setNotice]=useState('');
  const [savedEmail,setSavedEmail]=useState('');
  const [resetRequested,setResetRequested]=useState(false);
  const resetToken=params.get('token');
  const resetting=Boolean(resetToken);
  const next=safeAccountNext(params.get('next'));
  function switchMode(next){setLogin(next);setError('');setNotice('');setVisible(false);setResetRequested(false);}
  async function requestReset(){
    const input=document.querySelector('.account-card input[name="email"]');
    if(!input?.reportValidity()||!input.value)return;
    setBusy(true);setError('');setNotice('');
    try{
      const result=await accountClient.requestPasswordReset({email:input.value.trim().toLowerCase(),redirectTo:`/register?mode=signin${next?`&next=${encodeURIComponent(next)}`:''}`});
      if(result.error)setError('Could not send the password link. Please try again.');
      else{setResetRequested(true);setNotice('If an account exists for this email, a secure password link has been sent. Check your inbox and spam folder.');}
    }catch{setError('Could not send the password link. Please try again.');}
    finally{setBusy(false);}
  }
  async function submit(event){
    event.preventDefault(); setBusy(true); setError('');
    const fields=Object.fromEntries(new FormData(event.currentTarget));
    try{
      if(resetting){
        const result=await accountClient.resetPassword({newPassword:fields.password,token:resetToken});
        if(result.error)setError('This password link is invalid or expired. Request a new link from Sign in.');
        else window.location.assign(`/register?mode=signin&password=updated${next?`&next=${encodeURIComponent(next)}`:''}`);
        return;
      }
      const email=fields.email.trim().toLowerCase();
      const result=login?await accountClient.signIn.email({email,password:fields.password}):await accountClient.signUp.email({name:fields.name.trim(),email,password:fields.password});
      if(!login&&result.error?.code==='ACCOUNT_ALREADY_REGISTERED'){
        // A repeat registration must never imply that an existing password changed.
        const signedIn=await accountClient.signIn.email({email,password:fields.password});
        if(!signedIn.error)return;
        setSavedEmail(email);setLogin(true);setVisible(false);setNotice('');setResetRequested(false);
        setError('This email is already registered. Use your existing password or Google sign-in. To add or reset a password, choose Forgot or set password.');
      }
      else if(result.error)setError(result.error.code==='INVALID_EMAIL_OR_PASSWORD'?'Email or password not recognised. Registered with Google? Use Google sign-in, or set a password using the email link above.':result.error.message||'Please check your details and try again.');
      else if(!login){
        setSavedEmail(email);setLogin(true);setVisible(false);
        if(next){
          const signedIn=await accountClient.signIn.email({email,password:fields.password});
          if(!signedIn.error)return;
        }
        setNotice('Account created. Sign in with the same email and password you just registered with.');
      }
    }catch{setError('Unable to connect. Please try again.');}
    finally{setBusy(false);}
  }
  function google(){
    window.location.assign(`/api/account/google${next?`?next=${encodeURIComponent(next)}`:''}`);
  }
  if(session&&next&&!resetting)return <Navigate to={next} replace/>;
  return <main className="account-page">
    <div className="account-backdrop" aria-hidden="true">
      <svg className="account-flow-lines" viewBox="0 0 1600 950" preserveAspectRatio="none"><defs><linearGradient id="account-flow-cyan"><stop stopColor="#19bbff" stopOpacity="0"/><stop offset=".35" stopColor="#14b8ff" stopOpacity=".75"/><stop offset=".7" stopColor="#267fef" stopOpacity=".55"/><stop offset="1" stopColor="#19bbff" stopOpacity="0"/></linearGradient><linearGradient id="account-flow-amber"><stop stopColor="#f2842f" stopOpacity="0"/><stop offset=".55" stopColor="#f2842f"/><stop offset="1" stopColor="#f2842f" stopOpacity="0"/></linearGradient></defs>{Array.from({length:10},(_,i)=><path key={i} d={`M-100 ${420+i*13}C180 ${230+i*15} 370 ${890-i*8} 780 ${710+i*8}S1330 ${330+i*16} 1700 ${460+i*12}`} stroke="url(#account-flow-cyan)" strokeWidth="1"/>)}<path className="account-flow-pulse" d="M-100 510C180 330 370 850 780 735S1330 385 1700 530" stroke="url(#account-flow-amber)" strokeWidth="1.5"/></svg>
      <div className="account-sparks">{Array.from({length:16},(_,i)=><i key={i} style={{'--spark-left':`${(i*31+4)%100}%`,'--spark-top':`${(i*17+19)%100}%`,'--spark-delay':`${-i*.9}s`}}/>)}</div>
      <div className="account-dots account-dots-left"/><div className="account-dots account-dots-right"/>
    </div>
    <div className="account-content">
      <div className="account-story">
        <span className="account-story-kicker">JOIN THE 9WORK FORCE TEAM</span>
        <h2>Construction work.<br/><span>Across Victoria.</span></h2>
        <p>Connect with 9Work Force for construction labouring, civil and trade support opportunities. Share your experience, tickets and availability for work across Melbourne and Victoria.</p>
        <div className="account-construction-stage"><AccountConstruction/></div>
        <div className="account-story-caption"><span/>Melbourne &amp; regional Victoria · Construction labour hire</div>
      </div>
    <section className="account-layout">
    <div className="account-card">
      <Link className="account-brand" to="/" aria-label="9Work Force home"><img src="/assets/9workforce-footer-logo.webp" alt="9Work Force" width="1542" height="117"/></Link>
      {isPending?<p role="status">Loading your account…</p>:session&&!resetting?<AccountWelcome/>:<>
        {!resetting&&<div className="account-mode-switch" aria-label="Account access"><button type="button" aria-pressed={!login} disabled={busy} onClick={()=>switchMode(false)}>Register</button><button type="button" aria-pressed={login} disabled={busy} onClick={()=>switchMode(true)}>Sign in</button></div>}
        <h1>{resetting?'Set your password.':login?'Welcome back.':'Create your account.'}</h1><p>{resetting?'Choose a password to sign in with your email.':login?'Sign in to find work or request workers.':'One account to find work or hire workers.'}</p>
        {notice&&<p className="account-notice" role="status">{notice}</p>}
        {params.get('password')==='updated'&&<p className="account-notice" role="status">Password updated. Sign in with your email and new password.</p>}
        {!resetting&&<><button className="account-google" type="button" disabled={busy} onClick={google}><GoogleIcon/>Sign in with Google</button><div className="account-divider"><span>or continue with email</span></div></>}
        <form key={login?'signin':'signup'} onSubmit={submit}>
          {!login&&!resetting&&<label>Full name<input name="name" autoComplete="name" placeholder="Enter your full name" required minLength={2} maxLength={100}/></label>}
          {!resetting&&<label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={savedEmail} required maxLength={254}/></label>}
          <div className="account-field"><label htmlFor="account-password">Password</label><div className="account-password"><input id="account-password" aria-describedby={login&&!resetting?undefined:"account-password-help"} name="password" type={visible?'text':'password'} autoComplete={login&&!resetting?'current-password':'new-password'} placeholder={login&&!resetting?'Enter your password':'Create a password'} required minLength={8} maxLength={128}/><button type="button" aria-label={visible?'Hide password':'Show password'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{(!login||resetting)&&<small id="account-password-help"><LockKeyhole size={12} aria-hidden="true"/>Use at least 8 characters.</small>}</div>
          {!login&&!resetting&&<label className="account-consent"><input type="checkbox" required/><span>I agree to the <Link to="/legal">Terms & Conditions</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.</span></label>}
          {login&&!resetting&&<div className="account-reset-row">{resetRequested?<span className="account-reset-sent"><CircleCheck size={14} aria-hidden="true"/>Password link sent</span>:<button className="account-reset-link" type="button" aria-label="Forgot / set password via email" disabled={busy} onClick={requestReset}><KeyRound size={14} aria-hidden="true"/><span>Forgot or set password</span><ArrowRight size={13} aria-hidden="true"/></button>}</div>}
          {(error||params.has('error'))&&<p className="account-error" role="alert">{error||(params.get('error')==='google_not_configured'?'Google sign-in is not configured yet. Please use email registration for now.':params.get('error')==='google_start'?'Google sign-in could not be started. Please try again.':'Google sign-in was not completed. Please try again.')}</p>}
          <button className="account-primary" type="submit" disabled={busy}>{busy?'Please wait…':resetting?'Save password':login?'Sign in':'Create account'}<ArrowRight size={18}/></button>
        </form>
      </>}
    </div>
  </section></div></main>;
}
