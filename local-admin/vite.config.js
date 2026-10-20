import {defineConfig} from 'vite';
import {panelIdentity} from './dev-identity.mjs';
import {workspaceApi} from './api.mjs';
import {createLiveSync} from './live-submissions.mjs';
import {createLiveJobPublisher} from './live-job-posts.mjs';
export default defineConfig({
  plugins:[{name:'local-panel-identity',configureServer(server){const jobPublisher=createLiveJobPublisher({retryInterval:5000});server.httpServer?.once('close',()=>jobPublisher.close());server.middlewares.use(workspaceApi(undefined,{liveSync:createLiveSync(),jobPublisher,websiteUrl:'https://9workforce.com.au'}));server.middlewares.use((req,res,next)=>{
    if(req.url?.split('?')[0]!=='/__local-panel/status')return next();
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify(panelIdentity));
  })}}],
  server:{host:'127.0.0.1',port:3002,strictPort:true,fs:{strict:true,deny:['.env','.env.*','**/*.sqlite*','**/data/**','**/auth-secret','**/*.pem','**/*.crt']},watch:{ignored:['**/reference/**','**/data/**']}},
  preview:{host:'127.0.0.1',port:3002,strictPort:true},
  build:{outDir:'dist'},
});
