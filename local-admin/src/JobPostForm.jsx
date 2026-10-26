import React,{useState} from 'react';
import {Save} from 'lucide-react';
import {fields,labels,statuses,workTypes} from '../model.mjs';

export default function JobPostForm({initial,requests,employers,busy,onSave,error}){
 const [values,setValues]=useState(()=>Object.fromEntries([...fields.jobs,'status'].map(key=>[key,initial[key]??(key==='status'?'Draft':key==='company'?(requests.find(request=>request.id===initial.requestId)?.company||employers.find(employer=>employer.id===initial.employerId)?.company||''):'')])));
 const selectedRequest=requests.find(request=>request.id===values.requestId);
 const employerId=selectedRequest?.employerId||values.employerId;
 const employerMissing=Boolean(selectedRequest&&!employers.some(employer=>employer.id===selectedRequest.employerId));
 const invalidDates=Boolean(values.startDate&&values.endDate&&values.endDate<values.startDate);
 function changeRequest(requestId){
  const request=requests.find(row=>row.id===requestId);
  setValues(current=>({...current,requestId,employerId:request?.employerId||'',company:'',...(request?{
   company:request.company||employers.find(employer=>employer.id===request.employerId)?.company||'',title:request.position||'',workType:request.position||'',location:request.location||'',quantity:request.quantity||'',startDate:request.startDate||'',description:request.description||''
  }:{})}));
 }
 const change=key=>event=>{const value=event.target.value;setValues(current=>({...current,[key]:value}));};
 return <form onSubmit={event=>{event.preventDefault();if(!employerMissing&&!invalidDates)onSave({...values,employerId});}}>
  <div className="op-form-grid">
   <label>Employer request<select aria-label="Employer request" name="requestId" value={values.requestId} onChange={event=>changeRequest(event.target.value)}>
    <option value="">Select employer request</option>{requests.map(request=><option key={request.id} value={request.id}>{[request.reference,request.company||employers.find(employer=>employer.id===request.employerId)?.company,request.position].filter(Boolean).join(' · ')}</option>)}
   </select></label>
   <label>Employer<select aria-label="Employer" name="employerId" value={employerId} disabled={Boolean(selectedRequest)} onChange={event=>{const id=event.target.value;setValues(current=>({...current,employerId:id,company:employers.find(employer=>employer.id===id)?.company||''}));}}>
    <option value="">Select employer</option>{employers.map(employer=><option key={employer.id} value={employer.id}>{[employer.name,employer.company].filter(Boolean).join(' · ')}</option>)}
    {employerMissing&&<option value={employerId}>Linked employer unavailable</option>}
   </select></label>
   {fields.jobs.filter(key=>!['requestId','employerId','skills','requirements'].includes(key)).map(key=><label key={key}>{key==='company'?'Company name':labels[key]}{['description','requirements','aboutRole','keyResponsibilities'].includes(key)?<textarea aria-label={key==='company'?'Company name':labels[key]} name={key} value={values[key]} onChange={change(key)} placeholder={key==='aboutRole'?'Describe the role in a paragraph':key==='keyResponsibilities'?'Enter one bullet point per line':undefined}/>:<input aria-label={key==='company'?'Company name':labels[key]} name={key} value={values[key]} onChange={change(key)} required={['title','location','quantity'].includes(key)} list={key==='workType'?'job-work-types':undefined} type={key.includes('Date')?'date':key==='quantity'?'number':'text'} min={key==='quantity'?1:key==='endDate'?values.startDate||undefined:undefined} step={key==='quantity'?1:undefined} aria-invalid={key==='endDate'&&invalidDates?true:undefined} aria-describedby={key==='endDate'&&invalidDates?'job-date-error':undefined}/>}{key==='endDate'&&invalidDates&&<span id="job-date-error" className="op-error" role="alert">End date must be on or after the start date. Choose a later end date or leave it blank.</span>}</label>)}
   <label>Status<select aria-label="Status" name="status" value={values.status} onChange={change('status')}>{statuses.jobs.map(status=><option key={status}>{status}</option>)}</select></label>
  </div>
  <datalist id="job-work-types">{workTypes.map(type=><option key={type} value={type}/>)}</datalist>
  {employerMissing&&<p className="op-error" role="alert">The employer linked to this request is unavailable. Refresh the workspace before saving.</p>}
  <p className="op-note">Choose Open to publish this vacancy in the website opportunities section and Worker Find Jobs. Draft, Closed, Filled and deleted jobs are hidden from public listings.</p>
  {error&&<p className="op-error" role="alert">{error}</p>}
  <button disabled={busy||employerMissing} className="op-primary"><Save size={15} aria-hidden="true"/>{busy?'Saving…':'Save Job Post'}</button>
 </form>;
}
