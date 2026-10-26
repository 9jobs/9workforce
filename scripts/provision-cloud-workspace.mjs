import {DatabaseSync,backup} from 'node:sqlite';
import {mkdtempSync,copyFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {jobDatabase} from '../lib/jobDatabase.js';
import {liveEnvironment} from '../local-admin/live-submissions.mjs';
import {cloudWorkspaceSchema,encryptWorkspace,readWorkspaceState} from '../lib/cloudWorkspace.js';

const env=liveEnvironment(),pool=jobDatabase(env),directory=mkdtempSync(path.join(tmpdir(),'workforce-seed-'));
try{
 const source=new DatabaseSync('local-admin/data/workspace.sqlite',{readOnly:true});
 try{await backup(source,path.join(directory,'workspace.sqlite'));}finally{source.close();}
 copyFileSync('local-admin/data/settings-key',path.join(directory,'settings-key'));
 const db=new DatabaseSync(path.join(directory,'workspace.sqlite'));
 const admins=db.prepare("SELECT count(*) AS count FROM credentials c JOIN records r ON r.id=c.user_id WHERE json_extract(r.data,'$.role')='admin' AND json_extract(r.data,'$.status')='Active'").get().count;
 if(!admins)throw Error('Create a local administrator before provisioning.');
 // Local browser sessions are never transferred to the hosted panel.
 db.exec('DELETE FROM sessions');
 for(const table of ['workspace_login_challenges','workspace_auth_limits'])if(db.prepare("SELECT 1 FROM sqlite_master WHERE name=?").get(table))db.exec('DELETE FROM '+table);
 db.exec('PRAGMA wal_checkpoint(TRUNCATE)');db.close();
 const secret=readFileSync('local-admin/data/cloud-key','utf8').trim();
 await pool.query(cloudWorkspaceSchema);
 const result=await pool.query("INSERT INTO public.workforce_admin_state(id,payload) VALUES('workspace',$1) ON CONFLICT(id) DO NOTHING RETURNING id",[encryptWorkspace(readWorkspaceState(directory),secret)]);
 console.log(result.rowCount?'Cloud admin provisioned from existing local records; sessions excluded.':'Cloud admin already provisioned; existing hosted state preserved.');
}finally{await pool.end();rmSync(directory,{recursive:true,force:true});}
