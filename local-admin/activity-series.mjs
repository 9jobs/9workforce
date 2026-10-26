// Counts creation dates from the current snapshot; never invents a trend.
export function activitySeries(records,now=new Date(),dayCount=7){
 const today=new Date(now);today.setHours(0,0,0,0);
 const days=Array.from({length:dayCount},(_,index)=>{
  const date=new Date(today);date.setDate(date.getDate()-(dayCount-1)+index);
  return {date,count:0};
 });
 const key=date=>`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
 const byDay=new Map(days.map(day=>[key(day.date),day]));
 for(const record of records){
  if(record.deletedAt||!record.createdAt)continue;
  const date=new Date(record.createdAt);
  if(!Number.isFinite(date.getTime())||date>now)continue;
  const day=byDay.get(key(date));if(day)day.count++;
 }
 return days;
}
