import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const handlers={},shown=[],navigations=[];let pending;let binding='a'.repeat(32);
const worker={location:{origin:'https://mysuregas.com'},addEventListener:(type,fn)=>{handlers[type]=fn;},registration:{showNotification:async(...args)=>shown.push(args),getNotifications:async()=>[]},clients:{matchAll:async()=>[],openWindow:async url=>navigations.push(url)}};
const context=vm.createContext({self:worker,URL,Set,Promise,Response,console});
vm.runInContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),context);
context.testState=async(mode,value)=>{if(mode==='get')return binding;binding=value;};
vm.runInContext('pushState=testState',context);
async function push(value){pending=undefined;handlers.push({data:{json:()=>value},waitUntil:p=>{pending=p;}});await pending;}
await push({id:'n1',binding,url:'/shop/notifications',title:'Unsafe injected title',body:'Customer name and address'});
assert.equal(shown.length,1);assert.equal(shown[0][0],'MySureGas');assert.ok(!shown[0][1].body.includes('Customer name'));
await push({id:'n1',binding:'wrong',url:'/shop/notifications'});assert.equal(shown.length,1);
await push({id:'n1',binding,url:'https://evil.example'});assert.equal(shown.length,1);
await push({id:'n1',binding,url:'/shop/../admin/login'});assert.equal(shown.length,1);
const old=binding;binding=null;await push({id:'n2',binding:old,url:'/shop/notifications'});assert.equal(shown.length,1);
function click(data){pending=undefined;handlers.notificationclick({notification:{data,close(){}},waitUntil:p=>{pending=p;}});return pending;}
await click({binding:old,url:'/shop/notifications'});assert.equal(navigations.length,0);
binding=old;await click({binding:old,url:'/rider/notifications'});assert.equal(navigations[0],'https://mysuregas.com/rider/notifications');
await click({binding:old,url:'//evil.example'});assert.equal(navigations.length,1);
assert.equal(shown[0][1].tag,'mysuregas-n1');
console.log('BACKGROUND ALERT WORKER: PASS (generic previews, session binding, signed-out suppression, click destinations and notification tags). Browser/OS delivery still needs a physical-device test.');
