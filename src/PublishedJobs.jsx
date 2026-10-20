import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,BriefcaseBusiness,MapPin,Wallet,ShieldCheck,ChevronDown} from 'lucide-react';
import {formatHourlyJobPay,formatJobDate} from './jobPresentation';
import './published-jobs.css';

function JobCard({job,index}){
 const [expanded,setExpanded]=useState(false);
 return <article className="job-opening" data-job-reference={job.reference}>
  <div className="job-opening-main"><span className="job-opening-number">{String(index+1).padStart(2,'0')}</span><div>
   <h3 className="job-opening-title">{job.title}</h3>{job.company&&<p className="job-opening-company">{job.company}</p>}<p className="job-opening-description">{job.description||'Construction work opportunity in Victoria.'}</p>
   <div className="job-opening-actions"><Link className="job-opening-apply" to="/find-work#register">Apply now <ArrowRight size={14} aria-hidden="true"/></Link><button type="button" className="job-opening-view" aria-expanded={expanded} aria-controls={'job-details-'+job.id} onClick={()=>setExpanded(value=>!value)}>{expanded?'Hide details':'Job details'} <ChevronDown size={14} aria-hidden="true"/></button></div>
  </div></div>
  <div className="job-opening-meta"><span><MapPin size={16} aria-hidden="true"/><b>{job.location}</b><small>Project location</small></span><span><BriefcaseBusiness size={16} aria-hidden="true"/><b>{job.employmentType||'Labour-hire role'}</b><small>Work opportunity</small></span><span className="job-opening-pay"><Wallet size={16} aria-hidden="true"/><b>Pay rate</b><small>{formatHourlyJobPay(job.rate)}</small></span><div className="job-opening-tickets"><ShieldCheck size={15} aria-hidden="true"/>{job.tickets||'Relevant experience and site requirements apply.'}</div></div>
  <div id={'job-details-'+job.id} className="job-opening-expanded" hidden={!expanded}><dl className="job-opening-facts">{[['Work type',job.workType],['Workers required',job.quantity],['Start date',formatJobDate(job.startDate)],['End date',formatJobDate(job.endDate)],['Experience',job.experience]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
 </article>;
}

export default function PublishedJobs(){
 const [jobs,setJobs]=useState([]),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  let active=true,pending=false;const controller=new AbortController();
  async function load(){
   if(pending||document.hidden)return;pending=true;
   try{const response=await fetch('/api/jobs',{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('Vacancies unavailable');
    const data=await response.json();if(!Array.isArray(data.jobs))throw Error('Invalid vacancies');
    if(active){setJobs(data.jobs);setFailed(false);setLoaded(true);}
   }catch(error){if(active&&error.name!=='AbortError')setFailed(true);}finally{pending=false;}
  }
  load();const timer=setInterval(load,5000);window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);
  return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',load);};
 },[]);
 if(!loaded&&!failed)return <section className="published-jobs" aria-label="Current job openings"><p role="status">Loading current job openings…</p></section>;
 return <section className="published-jobs" aria-label="Current job openings">
  <h3 className="published-jobs-heading">Current job openings</h3>
  {failed&&<p role="status">Current vacancies could not be refreshed. Please try again shortly.</p>}
  {loaded&&!jobs.length&&!failed&&<p className="job-openings-empty" role="status">No current job openings. Please check back soon.</p>}
  <div className="published-jobs-list">{jobs.map((job,index)=><JobCard key={job.id} job={job} index={index}/>)}</div>
 </section>;
}
