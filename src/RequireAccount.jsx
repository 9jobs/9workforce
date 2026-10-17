import React from 'react';
import {Link,Navigate,useLocation} from 'react-router-dom';
import {accountClient} from './accountClient';
import {safeAccountNext} from '../lib/accountNext';

export function redirectIfSignedOut(response){
  if(response.status!==401)return false;
  const next=safeAccountNext(window.location.pathname+window.location.search+window.location.hash)||'/find-work#register';
  window.location.assign(`/register?mode=signin&next=${encodeURIComponent(next)}`);
  return true;
}

export default function RequireAccount({children,redirect=true,target}){
  const {data:session,isPending}=accountClient.useSession();
  const location=useLocation();
  const next=safeAccountNext(target||location.pathname+location.search+location.hash)||'/find-work#register';
  const login=`/register?mode=signin&next=${encodeURIComponent(next)}`;
  if(isPending)return <p className="account-access-loading" role="status">Checking your account…</p>;
  if(session)return children;
  if(redirect)return <Navigate to={login} replace/>;
  return <div className="account-access-prompt"><h3>Sign in to register for work.</h3><p>Create an account or sign in to complete your worker registration.</p><Link className="btn orange" to={login}>Sign in / Register</Link></div>;
}

export function WorkerFormEntry({children}){
  const {hash}=useLocation();
  return hash==='#register'?<RequireAccount>{children}</RequireAccount>:children;
}
