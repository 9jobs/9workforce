import {jobDatabase} from '../lib/jobDatabase.js';
import {publicJob} from '../lib/publicJobFields.js';
import {liveEnvironment} from './live-submissions.mjs';

export const jobSchema=`CREATE TABLE IF NOT EXISTS public.workforce_job_posts (
 id TEXT PRIMARY KEY,data JSONB NOT NULL,status TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),deleted_at TIMESTAMPTZ
);
ALTER TABLE public.workforce_job_posts ENABLE ROW LEVEL SECURITY;`;

export function createLiveJobPublisher({env=liveEnvironment(),database,retryInterval=0}={}){
 const pool=database||jobDatabase(env);let pending,attachedStore;
 // PostgreSQL may close an idle pooled connection; keep the local server alive.
 pool.on?.('error',()=>console.error('Job database connection interrupted. Pending job changes will retry.'));
 async function publish(store,id){
  const row=store.get('jobs',id);
  await pool.query(`INSERT INTO public.workforce_job_posts(id,data,status,created_at,deleted_at) VALUES($1,$2,$3,$4,$5)
   ON CONFLICT(id) DO UPDATE SET data=excluded.data,status=excluded.status,deleted_at=excluded.deleted_at,updated_at=now()`,[row.id,JSON.stringify(publicJob(row)),row.status,row.createdAt,row.deletedAt||null]);
  const latest=store.get('jobs',id);
  // Do not clear a newer change while an older network request is in flight.
  if(latest.publicationRevision===row.publicationRevision)store.put('jobs',{...latest,publicationPending:false,publishedAt:new Date().toISOString()});
 }
 async function flush(store){
  attachedStore=store;
  if(pending)return pending;
  pending=(async()=>{let rows;while((rows=store.list('jobs').filter(j=>j.publicationPending)).length)for(const row of rows)await publish(store,row.id);})().finally(()=>{pending=null;});
  return pending;
 }
 const timer=retryInterval>0?setInterval(()=>{if(attachedStore)flush(attachedStore).catch(()=>{});},retryInterval):null;
 timer?.unref?.();
 return {flush,close:()=>{if(timer)clearInterval(timer);return pool.end();}};
}
