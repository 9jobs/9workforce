import React from 'react';

export default function ActivityChart({label,days,loaded}){
 if(!loaded)return <div className="metric-chart-loading" role="status">Loading activity…</div>;
 const total=days.reduce((sum,day)=>sum+day.count,0),max=Math.max(1,...days.map(day=>day.count));
 const dateLabel=date=>date.toLocaleDateString('en-AU',{day:'numeric',month:'short'});
 return <figure className={`metric-chart${total?'':' is-empty'}`}>
  <svg viewBox="0 0 210 62" role="img" aria-label={`${label}: ${total} records created in the last 7 days`}>
   <path d="M0 56H210 M0 30H210 M0 4H210" className="metric-chart-grid"/>
   {days.map((day,index)=><rect key={day.date.toISOString()} x={index*30+7} y={56-day.count/max*48} width="16" height={day.count/max*48} rx="3" fill="currentColor"><title>{dateLabel(day.date)}: {day.count} added</title></rect>)}
  </svg>
  {!total&&<span className="metric-chart-empty">No new records in 7 days</span>}
  <figcaption><span>{dateLabel(days[0].date)}</span><span>{dateLabel(days[6].date)}</span></figcaption>
 </figure>;
}
