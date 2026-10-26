import test from 'node:test';
import assert from 'node:assert/strict';
import {activitySeries} from '../activity-series.mjs';
const now=new Date(2026,9,24,12);
test('empty activity stays flat across seven days',()=>{
 const days=activitySeries([],now);
 assert.deepEqual(days.map(day=>day.count),[0,0,0,0,0,0,0]);
 assert.equal(days[0].date.getDate(),18);
 assert.equal(days[6].date.getDate(),24);
});
test('counts real dates and excludes invalid, future, archived and older records',()=>{
 const at=(day,hour=8)=>new Date(2026,9,day,hour).toISOString();
 const days=activitySeries([{createdAt:at(18)},{createdAt:at(24)},{createdAt:at(24)},
  {createdAt:at(17)},{createdAt:at(25)},{createdAt:at(24,15)},
  {createdAt:at(20),deletedAt:at(21)},{createdAt:'invalid'},{}],now);
 assert.deepEqual(days.map(day=>day.count),[1,0,0,0,0,0,2]);
});
