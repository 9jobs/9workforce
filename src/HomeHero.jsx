import React, {useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowRight, ChevronDown, Search, MapPin, UserRound, Building2, HardHat, TrafficCone, Forklift, Hammer, Users} from 'lucide-react';
import './home-hero.css';
import {getWorkRolePath} from './workRolePaths';

const industries = ['General Construction Labourers', 'Skilled Construction Labourers', 'Trade Assistants', 'Civil Construction Labourers', 'Formwork & Concrete Labourers', 'Traffic Management Workers'];
const locations = ['Melbourne', 'Regional Victoria'];

function HeroSearch() {
  const [audience, setAudience] = useState('seeker');
  const navigate = useNavigate();

  function submitSearch(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of data) if (value.trim()) params.set(key, value.trim());
    navigate(`/work-search${params.size ? `?${params}` : ''}`);
  }

  function handleTabKey(event) {
    const tabs = ['seeker', 'employer'];
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = audience === 'seeker' ? 'employer' : 'seeker';
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[1];
    if (next) {
      event.preventDefault();
      setAudience(next);
      document.getElementById(`hero-${next}-tab`)?.focus();
    }
  }

  return <div className="home-search">
    <div className="home-search-tabs" role="tablist" aria-label="Find work or contact our team" onKeyDown={handleTabKey}>
      <button id="hero-seeker-tab" type="button" role="tab" aria-selected={audience === 'seeker'} aria-controls="hero-seeker-panel" tabIndex={audience === 'seeker' ? 0 : -1} onClick={() => setAudience('seeker')}><UserRound size={24} aria-hidden="true"/><span>I’m a Construction Worker</span></button>
      <button id="hero-employer-tab" type="button" role="tab" aria-selected={audience === 'employer'} aria-controls="hero-employer-panel" tabIndex={audience === 'employer' ? 0 : -1} onClick={() => setAudience('employer')}><Building2 size={24} aria-hidden="true"/><span>I need construction workers</span></button>
    </div>
    <div className="home-search-panel" id="hero-seeker-panel" role="tabpanel" aria-labelledby="hero-seeker-tab" hidden={audience !== 'seeker'}>
      <form className="home-search-form" role="search" aria-label="Search work opportunities" onSubmit={submitSearch}>
        <label className="home-search-keyword"><span className="hero-sr-only">Construction role or keyword</span><Search size={24} aria-hidden="true"/><input name="query" placeholder="Search construction role" type="search" autoComplete="off"/></label>
        <label className="home-search-select"><span className="hero-sr-only">Construction work area</span><Building2 className="home-search-field-icon" size={24} aria-hidden="true"/><select name="industry" defaultValue=""><option value="">All Construction Areas</option>{industries.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={18} aria-hidden="true"/></label>
        <label className="home-search-select"><span className="hero-sr-only">Location</span><MapPin className="home-search-field-icon" size={24} aria-hidden="true"/><select name="location" defaultValue=""><option value="">All Victorian Locations</option>{locations.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={18} aria-hidden="true"/></label>
        <button className="home-search-submit" type="submit"><Search size={24} aria-hidden="true"/><span>Find Construction Work</span></button>
      </form>
    </div>
    <div className="home-search-panel home-employer-panel" id="hero-employer-panel" role="tabpanel" aria-labelledby="hero-employer-tab" hidden={audience !== 'employer'}>
      <div><strong>Tell us what your site needs.</strong><p>Share the roles, location and start date with our team by phone or email.</p></div>
      <Link className="home-search-submit" to="/contact">REQUEST WORKERS <ArrowRight size={20} aria-hidden="true"/></Link>
    </div>
  </div>;
}

export default function HomeHero() {
  return <section className="homepage-hero" aria-labelledby="homepage-heading">
    <div className="home-hero-site" aria-hidden="true"><img src="/assets/hero-clean-helmet-warehouse.png" alt="" width="1983" height="793" fetchPriority="high"/></div>
    <div className="homepage-hero-inner">
      <div className="homepage-hero-copy">
        <span className="home-hero-eyebrow">PEOPLE POWERING AUSTRALIA</span>
        <h1 id="homepage-heading">Construction labour<br/>when you <em>need it.</em></h1>
        <p>Tell us what your site needs. We’ll handle the workforce.</p>
        <div className="homepage-hero-actions"><Link className="home-hero-primary" to="/contact">REQUEST WORKERS <ArrowRight size={20} aria-hidden="true"/></Link><Link className="home-hero-secondary" to="/who-we-are">Learn More</Link></div>
      </div>
      <HeroSearch/>
      <ul className="home-hero-sectors" aria-label="Our work areas">
        {[[HardHat, 'General Construction Labourers'], [TrafficCone, 'Skilled Construction Labourers'], [Building2, 'Trade Assistants'], [Forklift, 'Civil Construction Labourers'], [Hammer, 'Formwork & Concrete Labourers'], [Users, 'Traffic Management Workers']].map(([Icon, label]) => <li key={label}><Icon aria-hidden="true"/><span>{label}</span></li>)}
      </ul>
    </div>
  </section>;
}

export function WorkSearchResults({roles, notes}) {
  const [params] = useSearchParams();
  const query = params.get('query')?.trim() || '';
  const industry = params.get('industry') || '';
  const location = params.get('location') || '';
  const matches = roles.map((role, index) => ({role, index})).filter(({role, index}) => {
    const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const text = `${role[0]} ${role[1]} ${industries[index]} ${notes[index]}`.toLocaleLowerCase();
    return (!industry || industries[index] === industry) && words.every(word => text.includes(word));
  });
  return <section className="section home-search-results">
    <Link className="home-search-back" to="/">← Back to home</Link>
    <h1>Work opportunities</h1>
    <p>Explore construction work across Victoria. Role availability and site locations depend on project requirements.</p>
    <div className="home-search-summary" role="status">{matches.length} matching work {matches.length === 1 ? 'area' : 'areas'}{query && <> · “{query}”</>}{industry && <> · {industry}</>}{location && <> · Preferred location: {location}</>}</div>
    <div className="home-search-result-list">{matches.length ? matches.map(({role, index}) => <article key={role[0]}><div><h2><Link className="work-role-title" to={getWorkRolePath(role[0])}>{role[0]}</Link></h2><p>{role[1]}</p><small><MapPin size={14} aria-hidden="true"/> Victoria · {notes[index]}</small></div><Link to={getWorkRolePath(role[0])}>Apply now <ArrowRight size={17} aria-hidden="true"/></Link></article>) : <div className="home-search-empty"><h2>No matching work areas</h2><p>Try a broader keyword or view all the work areas we recruit for.</p><Link to="/work-search">View all work areas <ArrowRight size={17} aria-hidden="true"/></Link></div>}</div>
      </section>;
}


