import {randomUUID} from 'node:crypto';

export function publicDocument({content,localOverrides,originalDocument,...metadata}){
 return {...metadata,mimeType:content?.slice(5,content.indexOf(';'))||'',size:content?Buffer.from(content.split(',')[1],'base64').length:0};
}
export function saveDocument(store,id,body,workerId){
 const old=id?store.get('documents',id):null;
 if(old?.deletedAt)store.fail('Document has been deleted.',404);
 if(Object.keys(body).some(key=>!['workerId','name','category','expiry','content'].includes(key)))store.fail('Unsupported document field.');
 if(old&&body.workerId&&body.workerId!==old.workerId)store.fail('A document cannot be moved to another worker.');
 const row={...old,id:old?.id||randomUUID(),workerId:old?.workerId||workerId,source:old?.source||'local-management',createdAt:old?.createdAt||new Date().toISOString()};
 const patch=Object.fromEntries(['name','category','expiry','content'].filter(key=>body[key]!==undefined).map(key=>[key,String(body[key]).trim()]));
 Object.assign(row,patch);store.get('workers',row.workerId);
 if(!row.name||row.name.length>160)store.fail('Enter a document name up to 160 characters.');
 if(!['Resume','Cover letter','Ticket','Other'].includes(row.category))store.fail('Choose document category.');
 if(row.expiry&&(!/^\d{4}-\d{2}-\d{2}$/.test(row.expiry)||Number.isNaN(Date.parse(row.expiry))))store.fail('Choose a valid expiry date.');
 if(!old||patch.content!==undefined){
  if(!/^data:(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|image\/(png|jpeg|webp));base64,[A-Za-z0-9+/=]+$/.test(row.content||''))store.fail('Choose a PDF, Word document, PNG, JPEG or WebP file.');
  if(Buffer.from(row.content.split(',')[1],'base64').length>2*1024*1024)store.fail('Choose a file up to 2 MB.');
 }
 if(old){row.originalDocument=old.originalDocument||{name:old.name,category:old.category,expiry:old.expiry||'',content:old.content};row.localOverrides={...old.localOverrides,...patch};}
 row.updatedAt=new Date().toISOString();store.put('documents',row);return publicDocument(row);
}
export function deleteDocument(store,id){
 const row=store.get('documents',id);store.put('documents',{...row,deletedAt:new Date().toISOString()});return {id,deleted:true};
}
