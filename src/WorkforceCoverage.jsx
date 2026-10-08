import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Search, MapPin, HardHat, Building2, Route, Users, X} from 'lucide-react';
import {australiaStates} from './coverageMapData';
import './workforce-coverage.css';

const cities = [
  {name:'Melbourne',region:'Melbourne Metro',lon:144.963,lat:-37.814,search:'CBD western northern south east suburbs'},
  {name:'Geelong',region:'Regional Victoria',lon:144.361,lat:-38.149,search:'surf coast'},
  {name:'Ballarat',region:'Regional Victoria',lon:143.85,lat:-37.563,search:'central highlands'},
  {name:'Bendigo',region:'Regional Victoria',lon:144.28,lat:-36.758,search:'central victoria'},
  {name:'Gippsland',region:'Regional Victoria',lon:146.53,lat:-38.197,search:'traralgon latrobe valley'},
];
const groups = [
  {title:'Melbourne Metro',text:'CBD, western suburbs, northern suburbs and south east.',icon:Building2},
  {title:'Regional Victoria',text:'Geelong, Ballarat, Bendigo and Gippsland.',icon:MapPin},
  {title:'Civil & infrastructure',text:'Labour support for roadworks, utilities and infrastructure projects.',icon:Route},
  {title:'Site support roles',text:'General labourers, skilled labourers and trade assistants.',icon:HardHat},
];
const stateLabels=[['WA',126,-25],['NT',133,-20],['SA',135,-29],['QLD',144,-23],['NSW',146,-32],['TAS',147,-43]];
const project = (lon,lat) => [(lon-112)*14,(-lat-9)*14];

export default function WorkforceCoverage() {
  const [selected,setSelected]=useState(0);
  const [city,setCity]=useState(cities[0]);
  const [query,setQuery]=useState('');
  const matches=cities.filter(item=>`${item.name} ${item.region} ${item.search}`.toLowerCase().includes(query.trim().toLowerCase()));
  const [x,y]=project(city.lon,city.lat);
  function chooseCity(item) {setCity(item);setSelected(item.region==='Melbourne Metro'?0:1);setQuery('');}
  function chooseGroup(index) {setSelected(index);if(index===0)setCity(cities[0]);if(index===1)setCity(cities[1]);}
  return <section className="workforce-coverage" aria-labelledby="coverage-heading">
    <div className="coverage-shell">
      <header className="coverage-heading-row">
        <div><span className="coverage-eyebrow"><i/>OUR SERVICE AREAS</span><h2 id="coverage-heading">Local knowledge.<br/><em>Workforce coverage.</em></h2><p>Construction labour support across Melbourne and Victoria.</p></div>
        <div className="coverage-search-wrap">
          <label className="coverage-search"><Search size={18} aria-hidden="true"/><span className="coverage-sr">Search a Victorian location</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setQuery('');if(event.key==='Enter'&&matches.length===1)chooseCity(matches[0]);}} placeholder="Search Melbourne, Geelong…" aria-controls="coverage-results" autoComplete="off"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Clear location search"><X size={16}/></button>}</label>
          <div id="coverage-results" className="coverage-results" hidden={!query.trim()}>{matches.length?matches.map(item=><button type="button" key={item.name} onClick={()=>chooseCity(item)}><MapPin size={16}/><span>{item.name}<small>{item.region}</small></span><ArrowRight size={16}/></button>):<p>No matching location. <Link to="/contact">Ask us about your site.</Link></p>}</div>
        </div>
      </header>
      <div className="coverage-content">
        <div className="coverage-locations">
          <div className="coverage-intro"><Users size={18}/><span>The right support for your site</span></div>
          <div className="coverage-options" aria-label="Explore workforce coverage">{groups.map(({title,text,icon:Icon},index)=><button key={title} type="button" className={`coverage-option${selected===index?' is-selected':''}`} aria-pressed={selected===index} onClick={()=>chooseGroup(index)}><span className="coverage-number">0{index+1}</span><span className="coverage-option-copy"><strong>{title}</strong><span>{text}</span></span><Icon className="coverage-option-icon" size={20} aria-hidden="true"/><ArrowRight size={18} aria-hidden="true"/></button>)}</div>
          <p className="coverage-note">Tell us your location, roles and start date. Our team will confirm suitable workers and availability.</p>
          <Link className="btn orange coverage-cta" to="/contact">Request Workers <ArrowRight size={16}/></Link>
        </div>
        <div className="coverage-map-panel">
          <div className="coverage-map-heading"><span><MapPin size={14}/>MELBOURNE &amp; VICTORIA</span><span className="coverage-north" aria-hidden="true">↑ N</span></div>
          <svg className="coverage-map" viewBox="0 0 640 510" role="img" aria-labelledby="coverage-map-title coverage-map-desc">
            <title id="coverage-map-title">Australia workforce map, Victoria highlighted</title><desc id="coverage-map-desc">Selected location: {city.name}. Use the location buttons below to explore Victoria.</desc>
            <defs><linearGradient id="coverage-land" x2="0" y2="1"><stop stopColor="#5274a3"/><stop offset="1" stopColor="#293f67"/></linearGradient><linearGradient id="coverage-victoria" x2="0" y2="1"><stop stopColor="#ffac50"/><stop offset="1" stopColor="#ff8628"/></linearGradient></defs>
            {australiaStates.map(state=><path key={state.name} d={state.path} className={state.name==='Victoria'?'coverage-state-vic':'coverage-state'}><title>{state.name}</title></path>)}
            {stateLabels.map(([label,lon,lat])=>{const [sx,sy]=project(lon,lat);return <text key={label} x={sx} y={sy} className="coverage-state-label">{label}</text>;})}
            <text x="325" y="470" className="coverage-ocean">SOUTHERN OCEAN</text>
            <g transform={`translate(${x} ${y})`} className="coverage-location-pin"><circle className="coverage-pin-pulse" r="10"/><circle r="5" className="coverage-pin-core"/><path d="M8 0 H50 L68 -28 H118" className="coverage-pin-leader"/><text x="70" y="-36" className="coverage-pin-label">{city.name}</text></g>
          </svg>
          <div className="coverage-map-summary" aria-live="polite"><span className="coverage-live-dot"/><div><strong>{selected<2?city.name:groups[selected].title}</strong><p>{selected<2?`${city.region} · Victoria`:groups[selected].text}</p></div><span className="coverage-vic-tag">VIC</span></div>
          <div className="coverage-city-list" aria-label="Select a location">{cities.map(item=><button type="button" key={item.name} aria-pressed={item.name===city.name} onClick={()=>chooseCity(item)}>{item.name}</button>)}</div>
        </div>
      </div>
    </div>
  </section>;
}
