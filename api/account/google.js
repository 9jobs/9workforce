import {productionAccountAuth,accountUnavailable} from '../../lib/productionAccountAuth.js';

export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
  try{return await (await productionAccountAuth()).startGoogle(req,res);}
  catch{console.error('Google sign-in unavailable. Check production auth configuration.');return accountUnavailable(res);}
}
