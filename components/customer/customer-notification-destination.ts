import { orderSupportNotificationHref } from '@/components/support/support-links';
import type { NotificationRecord } from '@/types/notification';
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function customerNotificationDestination(item:NotificationRecord){
 const support=orderSupportNotificationHref(item.data,'customer');if(support)return {href:support,label:'Open support conversation'};
 const data=item.data&&typeof item.data==='object'&&!Array.isArray(item.data)?item.data:null;
 if(uuid(data?.orderId))return {href:`/shop/orders?order=${encodeURIComponent(data.orderId)}`,label:'View your order'};
 if(['CAMPAIGN_GIVEAWAY_WINNER','VOUCHER_EXPIRING','VOUCHER_EXPIRED'].includes(String(data?.event)))return {href:'/shop/vouchers'+(uuid(data?.voucherId)?`#voucher-${data.voucherId}`:''),label:data?.event==='VOUCHER_EXPIRED'?'View expired voucher':'View my voucher'};
 if(['CAMPAIGN_ENTRY_QUALIFIED','CAMPAIGN_ENTRY_DISQUALIFIED'].includes(String(data?.event)))return {href:'/shop/giveaways'+(uuid(data?.campaignId)?`#campaign-${data.campaignId}`:''),label:'View my giveaway entry'};
 if(item.type==='PROMOTION')return {href:'/shop',label:'Explore the shop'};
 return ['ORDER','DELIVERY','PAYMENT'].includes(item.type)?{href:'/shop/orders',label:'View your orders'}:null;
}
