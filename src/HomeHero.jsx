import React, {useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowRight, ChevronDown, Search, MapPin} from 'lucide-react';
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
      <button id="hero-seeker-tab" type="button" role="tab" aria-selected={audience === 'seeker'} aria-controls="hero-seeker-panel" tabIndex={audience === 'seeker' ? 0 : -1} onClick={() => setAudience('seeker')}>I’m a Job Seeker</button>
      <button id="hero-employer-tab" type="button" role="tab" aria-selected={audience === 'employer'} aria-controls="hero-employer-panel" tabIndex={audience === 'employer' ? 0 : -1} onClick={() => setAudience('employer')}>I’m an Employer</button>
    </div>
    <div className="home-search-panel" id="hero-seeker-panel" role="tabpanel" aria-labelledby="hero-seeker-tab" hidden={audience !== 'seeker'}>
      <form className="home-search-form" role="search" aria-label="Search work opportunities" onSubmit={submitSearch}>
        <label className="home-search-keyword"><span className="hero-sr-only">Job title or keyword</span><Search size={24} aria-hidden="true"/><input name="query" placeholder="Search job title or keyword" type="search" autoComplete="off"/></label>
        <label className="home-search-select"><span className="hero-sr-only">Industry</span><select name="industry" defaultValue=""><option value="">All Industries</option>{industries.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={18} aria-hidden="true"/></label>
        <label className="home-search-select"><span className="hero-sr-only">Location</span><select name="location" defaultValue=""><option value="">All Locations</option>{locations.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={18} aria-hidden="true"/></label>
        <button className="home-search-submit" type="submit"><span className="home-search-button-label">Search Jobs <Search size={24} aria-hidden="true"/></span><span className="btn-scroll-chevron" aria-hidden="true"><ChevronDown size={17}/><ChevronDown size={17}/></span></button>
      </form>
    </div>
    <div className="home-search-panel home-employer-panel" id="hero-employer-panel" role="tabpanel" aria-labelledby="hero-employer-tab" hidden={audience !== 'employer'}>
      <div><strong>Let’s talk about your project.</strong><p>Connect with our Victorian workforce operations team.</p></div>
      <Link className="home-search-submit" to="/contact">Contact Our Team <ArrowRight size={20} aria-hidden="true"/></Link>
    </div>
  </div>;
}

function HeroArtwork() {
  return <div className="home-hero-artwork">
    <div className="home-hero-disc" aria-hidden="true"/>
    <svg className="home-hero-orbit home-hero-orbit-back" viewBox="0 0 620 500" aria-hidden="true"><path d="M 466 202 C 591 199 614 245 545 290 C 459 345 301 394 166 399 C 61 403 23 379 54 335 C 76 302 127 278 178 257"/></svg>
    <img className="home-hero-worker" src="/assets/hero-worker-transparent.png" alt="Construction worker wearing a hard hat and high-visibility workwear" width="1536" height="1024" fetchPriority="high"/>
    <svg className="home-hero-orbit home-hero-orbit-front" viewBox="0 0 620 500" aria-hidden="true"><defs><radialGradient id="hero-orbit-glow"><stop stopColor="#ffb45b"/><stop offset=".46" stopColor="#ff8e38"/><stop offset=".7" stopColor="#ffbc79"/><stop offset="1" stopColor="#fff"/></radialGradient></defs><path d="M 54 335 C 23 379 61 403 166 399 C 301 394 459 345 545 290"/><circle cx="166" cy="399" r="11" fill="url(#hero-orbit-glow)"/><circle cx="545" cy="290" r="6" fill="url(#hero-orbit-glow)"/></svg>
  </div>;
}

export default function HomeHero() {
  return <section className="homepage-hero" aria-labelledby="homepage-heading">
    <div className="home-hero-site" aria-hidden="true"/>
    <div className="home-hero-dots" aria-hidden="true"/>
    <div className="homepage-hero-inner">
      <div className="homepage-hero-copy">
        <h1 id="homepage-heading">Building a Reliable<br/>Workforce<br/>for Our Projects.</h1>
        <p>We recruit reliable and work-ready people for construction, civil construction, traffic management, warehousing, and other operational roles across Victoria.</p>
        <div className="homepage-hero-actions"><Link className="home-hero-primary" to="/find-work">Find Work <ArrowRight size={20} aria-hidden="true"/></Link><Link className="home-hero-secondary" to="/find-work#register">Register Your Details <ArrowRight size={20} aria-hidden="true"/></Link></div>
      </div>
      <HeroArtwork/>
      <HeroSearch/>
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
