import {mkdirSync} from 'node:fs';
import path from 'node:path';

export async function accountDatabase(root,env,{migrate=false}={}){
  if(env.DATABASE_URL){
    const [{Pool},{Kysely,PostgresDialect}]=await Promise.all([import('pg'),import('kysely')]);
    const pool=new Pool({connectionString:env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,allowExitOnIdle:true});
    if(env.VERCEL==='1'){
      const {attachDatabasePool}=await import('@vercel/functions');attachDatabasePool(pool);
    }
    const schema='workforce_auth';
    if(migrate)await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    const db=new Kysely({dialect:new PostgresDialect({pool})});
    // Schema qualification also works with Supabase's transaction pooler.
    // Auth tables are kept outside the schemas exposed by the public REST API.
    const database={db,type:'postgres',schemaName:schema,transaction:true};
    const sqlText=sql=>{
      let index=0;
      const ignore=sql.includes('INSERT OR IGNORE');
      let query=sql.replace(/INSERT OR IGNORE/,'INSERT').replace(/next_attempt INTEGER/g,'next_attempt BIGINT').replace(/\bregistration_delivery\b/g,'"workforce_auth"."registration_delivery"').replace(/\?/g,()=>`$${++index}`);
      if(ignore)query+=' ON CONFLICT (user_id) DO NOTHING';
      return query;
    };
    const notifications={
      exec:sql=>pool.query(sqlText(sql)),
      prepare:sql=>({all:async(...args)=>(await pool.query(sqlText(sql),args)).rows,run:(...args)=>pool.query(sqlText(sql),args)}),
      // Atomic leases prevent two serverless instances sending the same job.
      claim:async()=>{
        const result=await pool.query(`UPDATE workforce_auth.registration_delivery SET next_attempt=$1 WHERE user_id IN (SELECT user_id FROM workforce_auth.registration_delivery WHERE completed=0 AND next_attempt<=$2 ORDER BY registered_at FOR UPDATE SKIP LOCKED LIMIT 5) RETURNING *`,[Date.now()+180000,Date.now()]);
        return result.rows;
      },
    };
    return {database,notifications,close:()=>db.destroy(),persistent:true};
  }
  const {DatabaseSync}=await import('node:sqlite');
  const directory=path.join(root,'data');mkdirSync(directory,{recursive:true});
  const database=new DatabaseSync(path.join(directory,'accounts.sqlite'));
  database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  return {database,notifications:database,close:()=>database.close(),persistent:false};
}
