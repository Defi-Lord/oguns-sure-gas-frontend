const routes=new Set(['/shop','/shop/cart','/shop/checkout','/shop/orders','/shop/profile','/shop/giveaways','/shop/vouchers','/shop/notifications','/shop/support','/shop/login','/shop/register','/shop/welcome']);
export function nativeDestination(value:string,currentPath:string):string|null{
 if(!isCustomerNativePath(currentPath))return null;
 try{const u=new URL(value);if(!(u.protocol==='mysuregas:'&&u.hostname==='app'))return null;const path=u.pathname.replace(/\/$/,'')||'/shop';return routes.has(path)?path:null;}catch{return null;}
}
export function externalBrowserUrl(value:string,origin:string):string|null{
 try{const u=new URL(value,origin);return u.protocol==='https:'&&u.origin!==origin&&!u.username&&!u.password?u.href:null;}catch{return null;}
}

/** Native customer links cannot move a team workspace into the shop. */
function isCustomerNativePath(path:string):boolean{
 const clean=path.split(/[?#]/,1)[0]?.replace(/\/$/,'')||'/';
 return clean==='/'||clean==='/shop'||clean.startsWith('/shop/');
}
/** At a portal root or sign-in screen, Android back minimizes the app. */
export function nativeBackDestination(path:string):string|null{
 const clean=path.split(/[?#]/,1)[0]?.replace(/\/$/,'')||'/';
 for(const [prefix,home] of [['/staff','/staff'],['/rider','/rider'],['/admin','/admin/dashboard']] as const){
  if(clean===prefix||clean.startsWith(prefix+'/'))return clean===prefix||clean===home||clean===prefix+'/login'?null:home;
 }
 if(clean==='/'||clean==='/shop'||clean==='/shop/login'||clean==='/shop/register')return null;
 return clean.startsWith('/shop/')?'/shop':null;
}
