import {workTypes} from './model.mjs';
export const settingsMenus={
 home:[['profile','My Profile'],['security','Security & Login'],['notifications','Notifications'],['preferences','App Preferences'],['privacy','Privacy & Data']],
 admin:[['account','My Account'],['platform','Platform Settings'],['roles','Roles & Permissions'],['approvals','Approval Settings'],['notifications','Notifications & Templates'],['audit-logs','Audit Logs'],['security','Privacy & Security']],
 employer:[['account','Account & Security'],['company','Company Preferences'],['hiring','Hiring Preferences'],['assignments','Assignment Preferences'],['notifications','Notifications'],['privacy','Privacy & Data']],
 worker:[['account','Account & Security'],['jobs','Job Preferences'],['availability','Availability & Location'],['notifications','Notification Settings'],['documents','Document Reminders'],['privacy','Privacy & Profile Visibility']]
};
export const settingsBase=workspace=>workspace==='home'?'/settings':`/${workspace}/settings`;
export function settingsRoute(path){const parts=path.split('/').filter(Boolean);if(parts[0]==='settings')return {workspace:'home',section:parts[1]||'profile',valid:parts.length<=2&&settingsMenus.home.some(([key])=>key===(parts[1]||'profile'))};if(parts[1]==='settings'&&settingsMenus[parts[0]]){const section=parts[2]||'account';return {workspace:parts[0],section,valid:parts.length<=3&&settingsMenus[parts[0]].some(([key])=>key===section)};}return null;}
export const employmentTypes=['Full-time','Part-time','Casual','Contract','Temporary'];
export const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const timeZones=[...new Set([...Intl.supportedValuesOf('timeZone'),'Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Adelaide','Australia/Perth','Australia/Darwin','Australia/Hobart','Asia/Kolkata','UTC'])];
const field=(key,label,type='text',extra={})=>({key,label,type,...extra});
export const preferenceFields={
 security:[field('sessionHours','Session duration (hours)','select',{options:['1','4','12']})],
 privacy:[field('profileVisibility','Profile visibility','select',{options:['Private','Workspace']}),field('contactVisibility','Contact details visibility','select',{options:['Private','Workspace']})],
 preferences:[field('density','Layout density','select',{options:['Comfortable','Compact']}),field('timeFormat','Time format','select',{options:['24-hour','12-hour']}),field('language','Language','select',{options:['en-AU','en-GB','en-US']}),field('timeZone','Time zone','select',{options:timeZones}),field('dateFormat','Date format','select',{options:['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD']})],
 platform:[field('displayName','Platform display name','text',{required:true,max:80}),field('supportEmail','Support email','email',{max:254}),field('language','Default language','select',{options:['en-AU','en-GB','en-US']}),field('timeZone','Default time zone','select',{options:timeZones}),field('dateFormat','Default date format','select',{options:['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD']})],
 notifications:[field('email','Email notifications','toggle'),field('inApp','In-app notifications','toggle'),field('requests','Worker request updates','toggle',{roles:['admin','employer']}),field('workers','New worker registrations','toggle',{roles:['admin']}),field('jobs','New job alerts','toggle',{roles:['admin','worker']}),field('applications','Application updates','toggle'),field('assignments','Assignment updates','toggle'),field('documents','Document expiry reminders','toggle',{roles:['worker']})],
 company:[field('contact','Default contact person','select',{source:'contacts'}),field('site','Default site / work location','select',{source:'locations'}),field('notificationEmail','Company notification email','email')],
 hiring:[field('trades','Preferred trades','multi',{options:workTypes}),field('employmentType','Default job type','select',{options:employmentTypes}),field('locations','Preferred hiring locations','multi',{source:'locations'}),field('closingDays','Default application closing period (days)','number',{min:1,max:90})],
 assignments:[field('site','Default site','select',{source:'locations'}),field('requests','Worker request alerts','toggle'),field('updates','Assignment update notifications','toggle')],
 jobs:[field('trades','Preferred job categories / trades','multi',{options:workTypes}),field('employmentTypes','Preferred employment types','multi',{options:employmentTypes}),field('locations','Preferred work locations','multi',{source:'locations'})],
 availability:[field('days','Available days','multi',{options:days}),field('shifts','Preferred shifts','multi',{options:['Day','Afternoon','Night']}),field('status','Availability status','select',{options:['Available','Unavailable']}),field('radius','Preferred work radius (km)','number',{min:1,max:500}),field('locations','Preferred work locations','multi',{source:'locations'})],
 documents:[field('tickets','Licence / ticket expiry reminders','toggle'),field('other','Other document expiry reminders','toggle'),field('days','Remind me before expiry','multi',{options:['30','14','7']})]
};
export const platformDefaults={displayName:'9WORKFORCE',supportEmail:'',language:'en-AU',timeZone:'Australia/Sydney',dateFormat:'DD/MM/YYYY'};
export function defaults(platform=platformDefaults){return {
 preferences:{language:platform.language,timeZone:platform.timeZone,dateFormat:platform.dateFormat,density:'Comfortable',timeFormat:'24-hour'},
 security:{sessionHours:'12'},privacy:{profileVisibility:'Private',contactVisibility:'Private'},
 notifications:{email:false,inApp:true,requests:true,workers:true,jobs:true,applications:true,assignments:true,documents:true},
 company:{contact:'',site:'',notificationEmail:''},hiring:{trades:[],employmentType:'Casual',locations:[],closingDays:14},
 assignments:{site:'',requests:true,updates:true},jobs:{trades:[],employmentTypes:[],locations:[]},
 availability:{days:[],shifts:[],status:'Available',radius:25,locations:[]},documents:{tickets:true,other:true,days:['30','14','7']}
};}
export const groupRoles={security:['admin','employer','worker'],privacy:['admin','employer','worker'],preferences:['admin','employer','worker'],notifications:['admin','employer','worker'],platform:['admin'],company:['employer'],hiring:['employer'],assignments:['employer'],jobs:['worker'],availability:['worker'],documents:['worker']};
export function formatSettingDate(value,preferences={}){if(!value)return '—';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '—';const parts=new Intl.DateTimeFormat(preferences.language||'en-AU',{timeZone:preferences.timeZone||'Australia/Sydney',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(date);const get=type=>parts.find(part=>part.type===type)?.value;return preferences.dateFormat==='YYYY-MM-DD'?`${get('year')}-${get('month')}-${get('day')}`:preferences.dateFormat==='MM/DD/YYYY'?`${get('month')}/${get('day')}/${get('year')}`:`${get('day')}/${get('month')}/${get('year')}`;}
