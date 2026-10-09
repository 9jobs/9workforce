export function validateWorkerRequest(fields) {
  for(const key of ['fullName','company','phone','email','siteLocation','workersRequired','workerCount','startDate']) {
    if(!fields[key]?.trim())return 'Please complete all required worker request fields.';
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))return 'Please enter a valid email address.';
  if(!/^[+()\d\s.-]{6,32}$/.test(fields.phone)||fields.phone.replace(/\D/g,'').length<6)return 'Please enter a valid mobile number.';
  if(!['General Labourers','Skilled Labourers','Other'].includes(fields.workersRequired))return 'Please select the workers required.';
  if(!/^\d+$/.test(fields.workerCount)||Number(fields.workerCount)<1||Number(fields.workerCount)>10000)return 'Please enter a valid number of workers.';
  const date=new Date(`${fields.startDate}T00:00:00Z`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fields.startDate)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==fields.startDate)return 'Please enter a valid start date.';
  return '';
}

export function formatWorkerRequest(fields) {
  return [['Name','fullName'],['Company','company'],['Mobile','phone'],['Email','email'],['Site suburb / location','siteLocation'],['Workers required','workersRequired'],['How many workers','workerCount'],['Start date','startDate'],['What do you need','requirements']].map(([label,key])=>`${label}: ${fields[key]||'Not provided'}`).join('\n');
}
