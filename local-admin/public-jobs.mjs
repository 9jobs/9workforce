// Public vacancies contain job information only; employer contacts and staffing links stay private.
import {publicJob} from '../lib/publicJobFields.js';
export function publicJobs(store){return store.visible('jobs').filter(job=>job.status==='Open').map(publicJob);}
