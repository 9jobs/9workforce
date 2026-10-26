import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {devServerIdentity} from '../lib/devServerIdentity.js';
import {devServerStatus} from './dev-server-status.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let filePort;
try{filePort=readFileSync(path.join(root,'.env'),'utf8').match(/^PORT\s*=\s*['"]?(\d+)/m)?.[1];}catch{}
const port=Number(process.env.PORT||filePort||3001);
const identity=devServerIdentity(root);
const url=`http://127.0.0.1:${port}`;
let response,status;
try{({response,status}=await devServerStatus(url));}catch(error){
  console.error(`Unable to check ${url} after 3 attempts (${error.message}).`);
  console.error(`If an existing server is stuck, stop its terminal with Ctrl+C, then run npm run dev again.`);
  process.exit(1);
}
if(response){
  if(response.ok&&status?.app===identity.app&&status?.workspace===identity.workspace){
    console.log(`9Work Force is already running at ${url}`);
    console.log('Use the existing server. No second server was started.');
    process.exit(0);
  }
  console.error(`Port ${port} is used by another or older server. Stop that process, then run npm run dev again.`);
  process.exit(1);
}
const child=spawn(process.execPath,['local-admin/website-server.mjs'],{cwd:root,stdio:'inherit',env:process.env});
child.once('error',error=>{console.error(`Unable to start dev server: ${error.message}`);process.exitCode=1;});
child.once('exit',(code,signal)=>{process.exitCode=code??(signal?130:0);});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{child.kill(signal);});
