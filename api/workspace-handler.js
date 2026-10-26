import {sharedJobDatabase} from '../lib/jobDatabase.js';
import {serveCloudWorkspace} from '../lib/cloudWorkspace.js';

export default async function handler(req,res){
 const url=new URL(req.url,'https://9workforce.com.au');
 const route=url.searchParams.get('__workspace_path');
 if(route!==null){url.searchParams.delete('__workspace_path');url.pathname='/api/workspace/'+route;req.url=url.pathname+url.search;}
 if(!req.url.startsWith('/api/workspace/')){res.writeHead(404);return res.end();}
 return serveCloudWorkspace(req,res,{pool:sharedJobDatabase(),secret:process.env.WORKSPACE_CLOUD_KEY});
}
