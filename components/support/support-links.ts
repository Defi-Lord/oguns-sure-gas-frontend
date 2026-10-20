export function orderSupportNotificationHref(data:unknown,portal:'customer'|'staff'|'admin'){
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const value=data as Record<string,unknown>;
 if(!['ORDER_SUPPORT_CREATED','ORDER_SUPPORT_REPLIED','ORDER_SUPPORT_STATUS_CHANGED'].includes(String(value.event))||typeof value.supportCaseId!=='string'||!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value.supportCaseId))return null;
 const base=portal==='customer'?'/shop/support':portal==='staff'?'/staff/support':'/admin/support';
 return `${base}?case=${encodeURIComponent(value.supportCaseId)}`;
}
