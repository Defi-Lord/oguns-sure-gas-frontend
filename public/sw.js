/* Public offline fallback only. Never cache authenticated pages, API requests or payments. */
const CACHE='mysuregas-public-offline-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/offline.html','/pwa/icon-192.png'])).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mysuregas-public-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||request.mode!=='navigate'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(request).catch(async()=>await caches.match('/offline.html')||new Response('You are offline. Reconnect to use MySureGas.',{status:503,headers:{'Content-Type':'text/plain'}})));
});

// Push state contains an opaque device binding only, never credentials or account details.
function pushState(mode,value){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('mysuregas-push-v1',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('state');
 request.onerror=()=>reject(request.error);
 request.onsuccess=()=>{const db=request.result,tx=db.transaction('state',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('state');let result;
  const op=mode==='get'?store.get('binding'):value?store.put(value,'binding'):store.delete('binding');
  op.onsuccess=()=>{result=op.result;};tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};
 };
});}
const PUSH_PATHS=new Set(['/shop/notifications','/staff/notifications','/rider/notifications','/admin/notifications']);
self.addEventListener('message',event=>{
 if(event.data?.type!=='MYSUREGAS_PUSH_BIND'||!event.source?.url||new URL(event.source.url).origin!==self.location.origin)return;
 const binding=event.data.binding;
 if(binding!==null&&(typeof binding!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(binding)))return;
 event.waitUntil(pushState('set',binding).then(async()=>{
  if(!binding)for(const n of await self.registration.getNotifications())n.close();
  event.ports[0]?.postMessage({ok:true});
 }));
});
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let data;try{data=event.data?.json();}catch{return;}
  if(!data||typeof data.id!=='string'||data.id.length>100||!PUSH_PATHS.has(data.url)||typeof data.binding!=='string')return;
  const binding=await pushState('get');if(!binding||binding!==data.binding)return;
  const body=data.url==='/rider/notifications'?'A new rider update is ready in your inbox.':'A new MySureGas update is ready in your inbox.';
  await self.registration.showNotification('MySureGas',{body,icon:'/pwa/icon-192.png',badge:'/pwa/icon-192.png',tag:`mysuregas-${data.id}`,renotify:false,data:{url:data.url,binding,id:data.id}});
 })());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const data=event.notification.data;
  if(!data||!PUSH_PATHS.has(data.url)||await pushState('get')!==data.binding)return;
  const target=new URL(data.url,self.location.origin);
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){if(new URL(client.url).origin===target.origin){await client.navigate(target.href);await client.focus();return;}}
  await self.clients.openWindow(target.href);
 })());
});
