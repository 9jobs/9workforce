import React,{useState} from 'react';
import {api,Dialog} from './ui';

export function ProfileAvatar({profile,className=''}){
 const [failed,setFailed]=useState(false);
 const initials=(profile?.name||'User').split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase();
 return <span className={`profile-avatar ${className}`}>{profile?.avatar&&!failed?<img src={profile.avatar} alt={`${profile.name}'s profile`} onError={()=>setFailed(true)}/>:<span aria-label="Profile initials">{initials}</span>}</span>;
}

export default function ProfileManager({user,onSave,onClose}){
 const [email,setEmail]=useState(user.email||'');
 const [avatar,setAvatar]=useState(user.avatar||''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[reading,setReading]=useState(false);
 async function choosePhoto(event){
  const file=event.target.files?.[0];if(!file)return;
  setError('');
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>500*1024){setError('Choose a PNG, JPEG or WebP photo smaller than 500 KB.');event.target.value='';return;}
  setReading(true);
  try{const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read photo.'));reader.readAsDataURL(file)});setAvatar(image);}catch(e){setError(e.message)}finally{setReading(false)}
 }
 return <Dialog title="Manage Profile" className="profile-dialog" onClose={onClose}><form className={'profile-form'+(user.role==='admin'?' admin-profile':'')} onSubmit={async event=>{
  event.preventDefault();setBusy(true);setError('');
  try{const fields=Object.fromEntries(new FormData(event.currentTarget));const result=await api('profile','PATCH',{name:fields.name,email:fields.email,phone:fields.phone,avatar,...(fields.currentPassword?{currentPassword:fields.currentPassword}:{})});onSave(result.user);}catch(e){setError(e.message)}finally{setBusy(false)}
 }}>
  <div className="profile-photo-editor"><ProfileAvatar key={avatar} profile={{...user,avatar}}/><div><strong>{user.role==='admin'?user.name:'Profile photo'}</strong>{user.role==='admin'&&<span className="profile-photo-email">{user.email}</span>}<label className="profile-upload">Change photo<input aria-label="Upload profile photo" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||reading} onChange={choosePhoto}/></label><small>PNG, JPEG or WebP · up to 500 KB</small>{avatar&&<button type="button" disabled={busy} onClick={()=>setAvatar('')}>Remove photo</button>}</div></div>
  {user.role!=='admin'&&<p className="profile-role">{user.role.charAt(0).toUpperCase()+user.role.slice(1)} · Local workspace profile</p>}
  {user.role==='admin'&&<div className="profile-section-heading"><h3>Personal information</h3><p>Your email is also used to sign in.</p></div>}
  <label>Full name<input name="name" defaultValue={user.name} autoComplete="name" required maxLength={100} disabled={busy}/></label>
  <label>Email<input name="email" type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" maxLength={254} disabled={busy}/></label>
  {user.role==='admin'&&email.toLowerCase()!==(user.email||'').toLowerCase()&&<label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required disabled={busy}/></label>}
  <label>Phone<input name="phone" type="tel" defaultValue={user.phone||''} autoComplete="tel" maxLength={40} disabled={busy}/></label>
  {error&&<p className="op-error" role="alert">{error}</p>}
  <div className="profile-form-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="op-primary" disabled={busy||reading}>{busy?'Saving…':'Save profile'}</button></div>
 </form></Dialog>;
}
