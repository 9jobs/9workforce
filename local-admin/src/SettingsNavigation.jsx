import React,{useEffect,useId,useState} from 'react';
import {Settings,ChevronDown} from 'lucide-react';
import {settingsMenus,settingsBase} from '../settings-model.mjs';
export default function SettingsNavigation({workspace,path,onNavigate}){
 const base=settingsBase(workspace),active=path===base||path.startsWith(base+'/');
 const [open,setOpen]=useState(active);const id=useId();
 useEffect(()=>{if(active)setOpen(true)},[path,active]);
 return <div className="settings-navigation"><button className={'settings-nav-toggle'+(active?' is-current':'')} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}><Settings size={18}/><span>Settings</span><ChevronDown size={15} className={open?'is-expanded':''}/></button><div id={id} className="settings-subnav" hidden={!open}>{settingsMenus[workspace].map(([key,label])=><a key={key} href={`${base}/${key}`} aria-current={path===`${base}/${key}`||path===base&&key===settingsMenus[workspace][0][0]?'page':undefined} onClick={event=>{if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&event.button===0){event.preventDefault();onNavigate(`${base}/${key}`)}}}>{label}</a>)}</div></div>;
}
