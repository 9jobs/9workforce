export function formatJobPay(rate){
 const text=String(rate??'').trim();
 if(!text)return 'Confirmed per role';
 const amount=text.replace(/^(?:AUD\s*\$?|AU?\$|\$)\s*/i,'');
 return /^\d/.test(amount)?`AUD ${amount}`:text;
}
export function formatHourlyJobPay(rate){
 const formatted=formatJobPay(rate);
 if(/^AUD\s+\d[\d.,]*(?:\s*[-–]\s*\d[\d.,]*)?$/.test(formatted))return formatted+' / hour';
 return formatted.replace(/\s*(?:\/\s*(?:hours?|hrs?|h)|per\s+hour|hourly)\s*$/i,' / hour');
}
export function formatJobDate(value){
 if(!value)return '';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const date=new Date(`${value}T00:00:00Z`);
 return Number.isNaN(date.getTime())?value:date.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
}
