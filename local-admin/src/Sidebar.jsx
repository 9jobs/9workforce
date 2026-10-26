import React from 'react';
import {Building2,LayoutDashboard,Users,BriefcaseBusiness,ClipboardList,FileText,MapPin,CalendarDays,UserRound,FolderOpen} from 'lucide-react';
import AccountMenu from './AccountMenu';
import AdminHomeSidebar from './AdminHomeSidebar';
import Icon from './FigmaHomeIcon';

const menus={
  admin:[['Dashboard',LayoutDashboard],['Employer Requests',FileText],['Employers',Building2],['Workers',Users],['Job Posts',BriefcaseBusiness],['Applications',ClipboardList],['Assignments',MapPin],['User Accounts',UserRound]],
  employer:[['Dashboard',LayoutDashboard],['Employer Requests',ClipboardList],['Employers',Building2],['Assigned Workers',CalendarDays],['Account Details',UserRound]],
  worker:[['Dashboard',LayoutDashboard],['Workers',Users],['Account Details',UserRound],['Find Jobs',BriefcaseBusiness],['My Applications',ClipboardList],['My Assignments',CalendarDays],['Documents & Tickets',FolderOpen]],
};
export default function Sidebar({role,selection,onAction,onRole,onProfile,onLogout,onItem,activeItem,profile,mobileOpen,onClose,path,onNavigate,brand='9WORKFORCE'}){
  if(selection)return <AdminHomeSidebar {...{onRole,onAction,onProfile,onLogout,profile,mobileOpen,onClose,path,onNavigate,brand}}/>;
  const homeTheme=role==='employer'||role==='worker';
  const roleLabel=role.charAt(0).toUpperCase()+role.slice(1);
  return <>
    {mobileOpen&&<button className="sidebar-backdrop" onClick={onClose} aria-label="Close navigation"/>}
    <aside className={`workspace-sidebar ${homeTheme?'role-home-sidebar figma-home-sidebar':'admin-sidebar'}${mobileOpen?' is-open':''}`} aria-label="Workspace sidebar">
      {homeTheme?<div className="fh-brand"><div><strong>{brand}</strong><span>LOCAL</span></div><p>{roleLabel} workspace</p></div>:<div className="workspace-brand"><strong>{brand}</strong><span className="local-badge">LOCAL</span><p>{roleLabel} workspace</p></div>}
      <nav aria-label="Dashboard navigation" className="workspace-navigation">
        <section id={`menu-${role}`} className="workspace-submenu dedicated-menu" aria-label={`${roleLabel} menu`}>
          <p className="sidebar-caption">{role.toUpperCase()} MENU</p>
          {menus[role].map(([title,MenuIcon])=><button key={title} className={`workspace-menu-item${activeItem===title?' is-active':''}`} aria-current={activeItem===title?'page':undefined} onClick={()=>onItem(role,title)}><MenuIcon size={18}/><span>{title}</span></button>)}
        </section>
      </nav>
      {profile&&<div className={`welcome-sidebar-account${homeTheme?' fh-sidebar-account':''}`}><AccountMenu profile={profile} onProfile={onProfile} onLogout={onLogout} placement="account-menu-footer" menuIcon={homeTheme?<Icon name="account"/>:undefined}/></div>}
    </aside>
  </>;
}
