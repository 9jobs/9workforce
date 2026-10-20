import {Pool} from 'pg';
import {readFileSync} from 'node:fs';
let sharedPool;
export function jobDatabase(env=process.env){
 if(!env.DATABASE_URL)throw Error('Job database is not configured.');
 const connection=new URL(env.DATABASE_URL),supabase=connection.hostname.endsWith('.pooler.supabase.com')||connection.hostname.endsWith('.supabase.co');
 if(supabase)connection.searchParams.delete('sslmode');
 return new Pool({connectionString:connection.href,max:2,connectionTimeoutMillis:10000,statement_timeout:10000,...(supabase?{ssl:{ca:readFileSync(new URL('./certs/supabase-prod-ca.crt',import.meta.url),'utf8'),rejectUnauthorized:true}}:{})});
}
export function sharedJobDatabase(){return sharedPool??=jobDatabase();}
