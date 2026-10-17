import {productionAccountAuth,accountUnavailable} from '../../lib/productionAccountAuth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{return await (await productionAccountAuth()).handler(req,res);}
  catch{console.error('Authentication service unavailable. Check production auth configuration and database migration.');return accountUnavailable(res);}
}
