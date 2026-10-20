import React,{useState} from 'react';
import {Save} from 'lucide-react';

export default function DocumentEditor({document,workerId,busy,onSave}){
 const [name,setName]=useState(document?.name||''),[error,setError]=useState('');
 return <form className="document-editor" onSubmit={async event=>{
  event.preventDefault();setError('');const values=new FormData(event.currentTarget),file=values.get('file');
  const body={workerId,name:name.trim(),category:values.get('category'),expiry:values.get('expiry')||''};
  try{
   if(file?.size){
    if(file.size>2*1024*1024)throw Error('Choose a file up to 2 MB.');
    body.content=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Unable to read the file.'));reader.readAsDataURL(file)});
   }
   await onSave(body);
  }catch(error){setError(error.message);}
 }}>
  <div className="op-form-grid"><label>Document name<input aria-label="Document name" required maxLength={160} value={name} onChange={event=>setName(event.target.value)}/></label>
   <label>Document category<select aria-label="Document category" name="category" defaultValue={document?.category||'Resume'}>{['Resume','Cover letter','Ticket','Other'].map(category=><option key={category}>{category}</option>)}</select></label>
   <label>Expiry date (optional)<input aria-label="Expiry date" type="date" name="expiry" defaultValue={document?.expiry||''}/></label>
   <label>{document?'Replace file (optional)':'File (maximum 2 MB)'}<input aria-label="Document file" type="file" name="file" required={!document} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={event=>{if(!name&&event.target.files?.[0])setName(event.target.files[0].name)}}/></label>
  </div>
  <p className="op-note">PDF, Word or image files up to 2 MB. Changes are saved in this local management panel.</p>
  {error&&<p role="alert" className="op-error">{error}</p>}
  <button className="op-primary" disabled={busy}><Save size={15} aria-hidden="true"/>{busy?'Saving…':document?'Save document':'Upload document'}</button>
 </form>;
}
