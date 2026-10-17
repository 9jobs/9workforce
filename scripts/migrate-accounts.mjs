import {createAccountAuth} from '../lib/accountAuth.js';

try{process.loadEnvFile('.env.production.local');}catch{}
try{process.loadEnvFile('.env');}catch{}
process.env.NODE_ENV='production';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL to the production PostgreSQL connection string first.');
const auth=await createAccountAuth(process.cwd(),process.env,{migrate:true});
await auth.close();
console.log('Account tables migrated in the private workforce_auth schema.');
