import {timingSafeEqual} from 'node:crypto';
import {productionAccountAuth,accountUnavailable} from '../../lib/productionAccountAuth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
  const expected=process.env.CRON_SECRET?Buffer.from(`Bearer ${process.env.CRON_SECRET}`):null;
  const actual=Buffer.from(req.headers.authorization||'');
  if(!expected||actual.length!==expected.length||!timingSafeEqual(actual,expected))return res.status(401).json({error:'Unauthorized'});
  try{await (await productionAccountAuth()).processPending();return res.status(200).json({ok:true});}
  catch{return accountUnavailable(res);}
}
