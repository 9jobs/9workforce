import {sharedJobDatabase} from '../lib/jobDatabase.js';
import {publicJob} from '../lib/publicJobFields.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'});}
 try{const result=await sharedJobDatabase().query("SELECT data FROM public.workforce_job_posts WHERE status='Open' AND deleted_at IS NULL ORDER BY created_at DESC,id");return res.status(200).json({jobs:result.rows.map(({data})=>publicJob(data))});}
 catch{console.error('Public jobs database read failed.');return res.status(503).json({error:'Current job openings are temporarily unavailable.'});}
}
