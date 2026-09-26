import React, {useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowRight, ChevronDown, Search, MapPin, UserRound, Building2, HardHat, TrafficCone, Forklift, Hammer, Users} from 'lucide-react';
import './home-hero.css';

const industries = ['Construction', 'Traffic Management', 'Civil Construction', 'Warehousing', 'Trade Assistants', 'General Labour'];
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
      <button id="hero-seeker-tab" type="button" role="tab" aria-selected={audience === 'seeker'} aria-controls="hero-seeker-panel" tabIndex={audience === 'seeker' ? 0 : -1} onClick={() => setAudience('seeker')}><UserRound size={24} aria-hidden="true"/><span>I’m a Job Seeker</span></button>
      <button id="hero-employer-tab" type="button" role="tab" aria-selected={audience === 'employer'} aria-controls="hero-employer-panel" tabIndex={audience === 'employer' ? 0 : -1} onClick={() => setAudience('employer')}><Building2 size={24} aria-hidden="true"/><span>I’m an Employer</span></button>
    </div>
    <div className="home-search-panel" id="hero-seeker-panel" role="tabpanel" aria-labelledby="hero-seeker-tab" hidden={audience !== 'seeker'}>
      <form className="home-search-form" role="search" aria-label="Search work opportunities" onSubmit={submitSearch}>
        <label className="home-search-keyword"><span className="hero-sr-only">Job title or keyword</span><Search size={24} aria-hidden="true"/><input name="query" placeholder="Search job title or keyword" type="search" autoComplete="off"/></label>
        <label className="home-search-select"><span className="hero-sr-only">Industry</span><Building2 className="home-search-field-icon" size={24} aria-hidden="true"/><select name="industry" defaultValue=""><option value="">All Industries</option>{industries.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={18} aria-hidden="true"/></label>
        <label className="home-search-select"><span className="hero-sr-only">Location</span><MapPin className="home-search-field-icon" size={24} aria-hidden="true"/><select name="location" defaultValue=""><option value="">All Locations</option>{locations.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={18} aria-hidden="true"/></label>
        <button className="home-search-submit" type="submit"><Search size={24} aria-hidden="true"/><span>Search Jobs</span></button>
      </form>
    </div>
    <div className="home-search-panel home-employer-panel" id="hero-employer-panel" role="tabpanel" aria-labelledby="hero-employer-tab" hidden={audience !== 'employer'}>
      <div><strong>Let’s talk about your project.</strong><p>Connect with our Victorian workforce operations team.</p></div>
      <Link className="home-search-submit" to="/contact">Contact Our Team <ArrowRight size={20} aria-hidden="true"/></Link>
    </div>
  </div>;
}

export default function HomeHero() {
  return <section className="homepage-hero" aria-labelledby="homepage-heading">
    <div className="home-hero-site" aria-hidden="true"><img src="/assets/hero-clean-helmet-warehouse.png" alt="" width="1983" height="793" fetchPriority="high"/></div>
    <div className="homepage-hero-inner">
      <div className="homepage-hero-copy">
        <span className="home-hero-eyebrow">Labour Hire Solutions</span>
        <h1 id="homepage-heading">Real Opportunities.<br/>Lasting <em>Careers.</em></h1>
        <p>We connect skilled and reliable workers with leading projects across Victoria — from construction to warehousing and beyond.</p>
        <div className="homepage-hero-actions"><Link className="home-hero-primary" to="/find-work">Find Work <ArrowRight size={20} aria-hidden="true"/></Link><Link className="home-hero-secondary" to="/who-we-are">Learn More</Link></div>
      </div>
      <HeroSearch/>
      <ul className="home-hero-sectors" aria-label="Our work areas">
        {[[HardHat, 'Construction'], [TrafficCone, 'Traffic Management'], [Building2, 'Civil Construction'], [Forklift, 'Warehousing'], [Hammer, 'Labour Hire'], [Users, 'Other Operational Roles']].map(([Icon, label]) => <li key={label}><Icon aria-hidden="true"/><span>{label}</span></li>)}
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
    <h1>Work Opportunities</h1>
    <p>Explore the roles we recruit for across Victoria. Availability and site locations depend on current project requirements.</p>
    <div className="home-search-summary" role="status">{matches.length} matching work {matches.length === 1 ? 'area' : 'areas'}{query && <> · “{query}”</>}{industry && <> · {industry}</>}{location && <> · Preferred location: {location}</>}</div>
    <div className="home-search-result-list">{matches.length ? matches.map(({role, index}) => <article key={role[0]}><div><h2>{role[0]}</h2><p>{role[1]}</p><small><MapPin size={14} aria-hidden="true"/> Victoria · {notes[index]}</small></div><Link to="/find-work#register">Apply now <ArrowRight size={17} aria-hidden="true"/></Link></article>) : <div className="home-search-empty"><h2>No matching work areas</h2><p>Try a broader keyword or view all the work areas we recruit for.</p><Link to="/work-search">View all work areas <ArrowRight size={17} aria-hidden="true"/></Link></div>}</div>
  </section>;
}
