import {build} from 'vite';
import {cpSync,existsSync,readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';

await build();
// Separate entry/assets keep the public site and management UI independent.
await build({configFile:false,root:'local-admin',base:'/workspace/',define:{'import.meta.env.VITE_HOSTED_WORKSPACE':'true'},build:{outDir:'../dist/workspace',emptyOutDir:true}});
// Existing panel asset URLs are absolute. Copy only after collision checks.
function copyAssets(source,target){
 for(const item of readdirSync(source,{withFileTypes:true})){
  const from=path.join(source,item.name),to=path.join(target,item.name);
  if(item.isDirectory())copyAssets(from,to);
  else {if(existsSync(to)&&!readFileSync(from).equals(readFileSync(to)))throw Error('Public/admin asset collision: '+to);cpSync(from,to,{recursive:true});}
 }
}
copyAssets('local-admin/public/assets','dist/assets');
