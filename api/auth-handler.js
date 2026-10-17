import {productionAccountAuth,accountUnavailable} from '../lib/productionAccountAuth.js';

// Vercel's standalone functions need an explicit rewrite for nested auth URLs.
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const url=new URL(req.url,'https://auth.internal');
  const path=url.searchParams.get('__auth_path');
  if(path!==null){
    url.pathname=`/api/auth/${path}`;
    url.searchParams.delete('__auth_path');
    req.url=url.pathname+url.search;
  }
  try{return await (await productionAccountAuth()).handler(req,res);}
  catch{console.error('Authentication service unavailable. Check production auth configuration and database migration.');return accountUnavailable(res);}
}
