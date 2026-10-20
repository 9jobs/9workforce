import {jobDatabase} from '../lib/jobDatabase.js';
import {liveEnvironment} from './live-submissions.mjs';
import {jobSchema} from './live-job-posts.mjs';
const pool=jobDatabase(liveEnvironment());
try{const client=await pool.connect();try{await client.query('BEGIN');await client.query(jobSchema);await client.query('COMMIT');console.log('Job-post table ready; row-level security enabled. Existing form and account tables unchanged.');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}finally{await pool.end();}
