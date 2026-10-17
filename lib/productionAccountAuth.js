import {waitUntil} from '@vercel/functions';
import {createAccountAuth} from './accountAuth.js';

let pending;
export function productionAccountAuth(){
  if(!pending)pending=createAccountAuth(process.cwd(),process.env,{backgroundTask:promise=>waitUntil(promise.catch(()=>console.error('Registration delivery pending.')))}).catch(error=>{pending=undefined;throw error;});
  return pending;
}
export function accountUnavailable(res){
  res.setHeader('Cache-Control','no-store');
  return res.status(503).json({error:'Account service is temporarily unavailable. Please try again shortly.'});
}
