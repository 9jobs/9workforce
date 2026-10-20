import React from 'react';
import {ShieldCheck,Building2,HardHat,ChevronRight,ArrowLeft,LayoutDashboard,Users,BriefcaseBusiness,ClipboardList,FileText,MapPin,CalendarDays,Settings,UserRound,Clock3,LifeBuoy,Globe,FolderOpen,MessageSquareWarning} from 'lucide-react';

const groups=[
  {id:'admin',label:'Admin',description:'Manage workforce operations',icon:ShieldCheck},
  {id:'employer',label:'Employer',description:'Manage your sites & workers',icon:Building2},
  {id:'worker',label:'Worker',description:'Manage your work & profile',icon:HardHat},
];
const menus={
  admin:[['Dashboard',LayoutDashboard],['Employer Requests',FileText],['Employers',Building2],['Workers',Users],['Job Posts',BriefcaseBusiness],['Applications',ClipboardList],['Assignments',MapPin],['User Accounts',UserRound],['Settings',Settings]],
  employer:[['Dashboard',LayoutDashboard],['Employer Requests',ClipboardList],['Employers',Building2],['Assigned Workers',CalendarDays],['Account Details',UserRound]],
  worker:[['Dashboard',LayoutDashboard],['Workers',Users],['Account Details',UserRound],['Find Jobs',BriefcaseBusiness],['My Applications',ClipboardList],['My Assignments',CalendarDays],['Documents & Tickets',FolderOpen]],
};
export default function Sidebar({role,selection,onRole,onBack,onItem,activeItem,profile,mobileOpen,onClose}){
  return <>
    {mobileOpen&&<button className="sidebar-backdrop" onClick={onClose} aria-label="Close navigation"/>}
    <aside className={`workspace-sidebar${mobileOpen?' is-open':''}`} aria-label="Workspace sidebar">
      <div className="workspace-brand"><strong>9WORK<span>FORCE</span></strong><span className="local-badge">LOCAL</span><p>{selection?'Workforce workspace':`${groups.find(group=>group.id===role).label} workspace`}</p></div>
      <nav aria-label="Dashboard navigation" className="workspace-navigation">
        {selection?<><p className="sidebar-caption">CHOOSE YOUR WORKSPACE</p><div className="workspace-role-list">{groups.map(({id,label,description,icon:Icon})=><button key={id} className="workspace-role" data-workspace={id} onClick={()=>onRole(id)}><span className="workspace-role-icon"><Icon size={20}/></span><span><strong>{label}</strong><small>{description}</small></span><ChevronRight size={15} className="workspace-open-arrow"/></button>)}</div></>:<><button className="workspace-back" onClick={onBack}><ArrowLeft size={15}/>Back to workspaces</button><section id={`menu-${role}`} className="workspace-submenu dedicated-menu" aria-label={`${groups.find(group=>group.id===role).label} menu`}><p className="sidebar-caption">{role.toUpperCase()} MENU</p>{menus[role].map(([title,Icon])=><button key={title} className={`workspace-menu-item${activeItem===title?' is-active':''}`} aria-current={activeItem===title?'page':undefined} onClick={()=>onItem(role,title)}><Icon size={17}/><span>{title}</span></button>)}</section></>}
      </nav>
      {!selection&&<div className="workspace-footer"><span className="workspace-avatar">{role==='admin'?<ShieldCheck size={18}/>:role==='employer'?<Building2 size={18}/>:<HardHat size={18}/>}</span><div><strong>{role==='admin'?'Admin workspace':role==='employer'?'Employer workspace':'Worker workspace'}</strong><small>{role==='admin'?'Workforce management':role==='employer'?'Sites & staffing':'Registrations & opportunities'}</small></div><i title="Local preview active"/></div>}
    </aside>
  </>;
}
