import {randomBytes} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const file='local-admin/data/cloud-key';
try{writeFileSync(file,randomBytes(48).toString('hex'),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
const secret=readFileSync(file,'utf8').trim();
// Value only travels through stdin, never command arguments or logs.
const result=spawnSync('vercel.cmd',['env','add','WORKSPACE_CLOUD_KEY','production'],{input:secret,encoding:'utf8',shell:true,windowsHide:true});
if(result.status!==0){console.error('Cloud encryption environment setup failed. Check Vercel environment configuration.');process.exit(1);}
console.log('Production cloud-workspace encryption configured. Key stays in ignored local data.');
