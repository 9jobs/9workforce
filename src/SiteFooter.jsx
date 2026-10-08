import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Mail, Phone, MapPin, Users, ShieldCheck, HardHat} from 'lucide-react';
import './site-footer.css';

const features = [[Users,'Reliable','Workforce'],[ShieldCheck,'Compliance','Focused'],[HardHat,'Construction','Specialists']];

export default function SiteFooter({whatsAppIcon, instagramIcon}) {
  return <footer className="site-footer">
    <div className="site-footer-art" aria-hidden="true"><div className="site-footer-scene"/></div>
    <div className="site-footer-main">
      <div className="site-footer-brand">
        <Link to="/" className="site-footer-logo" aria-label="9Work Force home"><img src="/assets/9workforce-footer-logo.png" alt="9Work Force" width="320" height="36" loading="lazy"/></Link>
        <p>Providing reliable construction labour and workforce solutions for contractors, construction companies, project teams and businesses across Victoria.</p>
        <div className="site-footer-features">{features.map(([Icon, first, second]) => <div key={first}><span><Icon size={32} aria-hidden="true"/></span><p>{first}<br/>{second}</p></div>)}</div>
      </div>
      <div className="site-footer-social"><h2>Connect With Us</h2>
        <a href="https://www.linkedin.com/company/9work-force/" target="_blank" rel="noreferrer"><span><b className="site-footer-linkedin" aria-hidden="true">in</b></span>LinkedIn</a>
        <a href="https://wa.me/61422279428" target="_blank" rel="noreferrer"><span>{whatsAppIcon}</span>WhatsApp</a>
        <a href="https://www.instagram.com" target="_blank" rel="noreferrer"><span>{instagramIcon}</span>Instagram</a>
      </div>
      <div className="site-footer-contact"><h2>Get in Touch</h2>
        <a href="mailto:support@9workforce.com.au"><Mail size={25} aria-hidden="true"/><span>support@9workforce.com.au</span></a>
        <a href="tel:+61422279428"><Phone size={25} aria-hidden="true"/><span>+61 422 279 428</span></a>
        <p className="site-footer-location"><MapPin size={27} aria-hidden="true"/><span>Melbourne, Victoria, Australia</span></p>
        <div className="site-footer-request"><p>Need construction labour?</p><Link to="/contact">Contact 9Work Force <ArrowRight size={21} aria-hidden="true"/></Link></div>
      </div>
    </div>
    <div className="site-footer-bottom"><div>
      <p>© 9 JOBS PTY. LTD. trading as 9Work Force. All rights reserved.</p>
      <nav aria-label="Legal policies"><Link to="/modern-slavery-statement">Modern Slavery Statement</Link><Link to="/privacy-policy">Privacy Policy</Link><Link to="/workcover-terms">WorkCover Terms</Link></nav>
    </div></div>
  </footer>;
}
