const routes=new Set(['/shop','/shop/cart','/shop/checkout','/shop/orders','/shop/profile','/shop/giveaways','/shop/vouchers','/shop/notifications','/shop/support','/shop/login','/shop/register','/shop/welcome']);
export function nativeDestination(value:string):string|null{
 try{const u=new URL(value);if(!(u.protocol==='mysuregas:'&&u.hostname==='app'))return null;const path=u.pathname.replace(/\/$/,'')||'/shop';return routes.has(path)?path:null;}catch{return null;}
}
export function externalBrowserUrl(value:string,origin:string):string|null{
 try{const u=new URL(value,origin);return u.protocol==='https:'&&u.origin!==origin&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
