const keys=['id','reference','company','title','workType','location','quantity','rate','employmentType','skills','tickets','experience','startDate','endDate','description','requirements','createdAt'];
export function publicJob(job){return Object.fromEntries(keys.map(key=>[key,job[key]??'']));}
