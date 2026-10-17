export function accountDeployment(env={}){
  const hosted=env.VERCEL==='1'||env.NODE_ENV==='production';
  if(!hosted)return {hosted:false};
  if(!env.DATABASE_URL)throw new Error('Production authentication requires DATABASE_URL (PostgreSQL).');
  if(!env.BETTER_AUTH_SECRET||env.BETTER_AUTH_SECRET.length<32)throw new Error('Production authentication requires a stable BETTER_AUTH_SECRET of at least 32 characters.');
  let baseURL;
  try{baseURL=new URL(env.BETTER_AUTH_URL);}catch{throw new Error('Set BETTER_AUTH_URL to the public HTTPS origin.');}
  if(baseURL.protocol!=='https:'||baseURL.hostname.includes('*')||baseURL.username||baseURL.password||baseURL.pathname!=='/'||baseURL.search||baseURL.hash)throw new Error('BETTER_AUTH_URL must be an HTTPS origin without a path.');
  const trustedOrigins=[baseURL.origin,...(env.BETTER_AUTH_TRUSTED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)];
  for(const origin of trustedOrigins){const u=new URL(origin);if(u.protocol!=='https:'||u.hostname.includes('*')||u.origin!==origin)throw new Error('Production trusted origins must be explicit HTTPS origins.');}
  return {hosted:true,baseURL:baseURL.origin,trustedOrigins:[...new Set(trustedOrigins)]};
}
