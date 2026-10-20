import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {panelIdentity,panelRoot} from './dev-identity.mjs';

const url='http://127.0.0.1:3002';
let response;
try{
  response=await fetch(`${url}/__local-panel/status`,{signal:AbortSignal.timeout(2500),redirect:'manual'});
}catch(error){
  if(error.name==='TimeoutError'){
    console.error(`Port 3002 is occupied but is not responding. Close the existing server terminal, then run npm run dev again.`);
    process.exit(1);
  }
}
if(response){
  let status;
  try{status=await response.json();}catch{}
  if(response.ok&&status?.app===panelIdentity.app&&status?.workspace===panelIdentity.workspace){
    console.log(`9Work Force admin panel is already running.`);
    console.log(`Panel: ${url}`);
    console.log('Choose Admin, Employer or Worker from the sidebar. No second server was started.');
    process.exit(0);
  }
  console.error('Port 3002 is used by another server. Close that server terminal before starting the local admin panel.');
  process.exit(1);
}
const vite=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const child=spawn(process.execPath,[vite,'--host','127.0.0.1','--port','3002','--strictPort'],{cwd:panelRoot,stdio:'inherit',env:process.env});
child.once('error',error=>{console.error(`Unable to start the local admin panel: ${error.message}`);process.exitCode=1});
child.once('exit',(code,signal)=>{process.exitCode=code??(signal?130:0)});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));

