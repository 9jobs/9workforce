import test from 'node:test';
import assert from 'node:assert/strict';
import {getSelectedWorkRole,getWorkRoleSearchPath} from '../src/workRolePaths.js';
const roles=['General Construction Labourers','Skilled Construction Labourers','Trade Assistants','Civil Construction Labourers','Formwork & Concrete Labourers','Traffic Management Workers'];
test('a specific work area wins over a conflicting broad role dropdown',()=>{
 for(const title of roles)for(const query of ['','General Labourer','Construction Labourer','Labourer','Other']) assert.equal(getSelectedWorkRole(query,title,roles),title);
});
test('broad dropdown aliases resolve to the general labour details page',()=>{
 for(const query of ['General Labourer','Construction Labourer','Labourer'])assert.equal(getSelectedWorkRole(query,'',roles),roles[0]);
 for(const query of ['','Other','not-a-role'])assert.equal(getSelectedWorkRole(query,'',roles),null);
});
test('location is encoded separately without changing the selected role route',()=>{
 for(const title of roles)for(const location of ['','Melbourne','Regional Victoria']){
  const url=new URL(getWorkRoleSearchPath(title,location),'https://example.com');
  assert.equal(url.searchParams.get('location')||'',location);
  assert.ok(url.pathname.startsWith('/find-work/'));
  assert.ok(!url.pathname.endsWith('/apply'));
 }
 assert.equal(getWorkRoleSearchPath(roles[4],'Regional Victoria'),'/find-work/formwork-and-concrete-labourers?location=Regional+Victoria');
});
