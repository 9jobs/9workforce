import React,{useEffect,useRef} from 'react';
import {ChevronDown,UserRound,LogOut} from 'lucide-react';
import {ProfileAvatar} from './ProfileManager';
export default function AccountMenu({profile,onProfile,onLogout,placement='',menuIcon}){
 const ref=useRef(null);
 useEffect(()=>{
  const outside=event=>{if(!ref.current?.contains(event.target))ref.current?.removeAttribute('open')};
  const escape=event=>{if(event.key==='Escape'&&ref.current?.open){ref.current.removeAttribute('open');ref.current.querySelector('summary')?.focus()}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[]);
 if(!profile)return null;
 const label=profile.role==='admin'?'Admin':profile.role==='employer'?'Employer':'Worker';
 return <details ref={ref} className={`account-menu ${placement}`}><summary aria-label={`Account menu for ${profile.name}`}><span className="account-photo"><ProfileAvatar key={profile.avatar} profile={profile}/><i/></span><span className="account-identity"><strong>{profile.name}</strong><small>{label}</small></span>{menuIcon||<ChevronDown size={16}/>}</summary><div className="account-dropdown"><div className="account-dropdown-heading"><ProfileAvatar key={profile.avatar} profile={profile}/><div><strong>{profile.name}</strong><span>{label} account</span></div></div><span className="account-dropdown-email">{profile.email}</span><button onClick={event=>{event.currentTarget.closest('details').removeAttribute('open');onProfile()}}><UserRound size={16}/>Manage Profile</button><button onClick={event=>{event.currentTarget.closest('details').removeAttribute('open');onLogout()}}><LogOut size={16}/>Logout</button></div></details>;
}
