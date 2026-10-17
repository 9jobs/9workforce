export function safeAccountNext(value){
  if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return null;
  try{
    const url=new URL(value,'http://account.local');
    if(url.origin!=='http://account.local')return null;
    if(url.pathname!=='/request-workers'&&url.pathname!=='/find-work'&&!/^\/find-work\/[a-z0-9-]+\/apply$/.test(url.pathname))return null;
    return url.pathname+url.search+url.hash;
  }catch{return null;}
}
