'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import styles from './refund-panel.module.css';
type Refund = {status:string;reference:string;amountKobo:string;domain:string;providerRefundId:string|null};
type Payment = {id:string;reference:string;principal:string;status:string;orderNumber:string|null;refund:Refund|null};
type Queue = {enabled:boolean;liveEnabled:boolean;page:number;pageSize:number;total:number;payments:Payment[]};
type Quote = {amountKobo?:string;domain?:string;principal?:string;existing?:Refund};
function money(kobo:string){const value=BigInt(kobo);return `NGN ${(value/BigInt(100)).toLocaleString('en-NG')}.${String(value%BigInt(100)).padStart(2,'0')}`;}
export function RefundPanel(){
  const role=useAuthStore(state=>state.user?.role);
  const client=useQueryClient();
  const [page,setPage]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [review,setReview]=useState<{payment:Payment;quote:Quote}|null>(null);
  const query=useQuery({queryKey:['finance-refunds',page],enabled:role==='SUPER_ADMIN',
    queryFn:async()=> (await api.get<{data:Queue}>('/payments/refunds',{params:{page}})).data.data,refetchInterval:30_000});
  const refresh=()=>client.invalidateQueries({queryKey:['finance-refunds']});
  async function quote(payment:Payment){
    setBusy(true);setError('');setReview(null);
    try{const result=(await api.get<{data:Quote}>(`/payments/refunds/${payment.id}/quote`)).data.data;
      if(result.existing){await refresh();return;}
      if(!result.amountKobo||!result.domain)throw new Error('Refund quote is incomplete. Refresh before continuing.');
      setReview({payment,quote:result});
    }catch(e){setError(getApiErrorMessage(e));}finally{setBusy(false);}
  }
  async function submit(){
    if(!review?.quote.amountKobo)return;setBusy(true);setError('');
    try{await api.post(`/payments/refunds/${review.payment.id}/initiate`,{expectedAmountKobo:review.quote.amountKobo});setReview(null);await refresh();}
    catch(e){setError(getApiErrorMessage(e));setReview(null);await refresh();}finally{setBusy(false);}
  }
  async function reconcile(id:string){setBusy(true);setError('');try{await api.post(`/payments/refunds/${id}/reconcile`,{});await refresh();}
    catch(e){setError(getApiErrorMessage(e));}finally{setBusy(false);}}
  if(role!=='SUPER_ADMIN')return null;
  return <section className={styles.panel} aria-labelledby="refund-heading">
    <header><div><span className={styles.eyebrow}>PAYMENT CARE</span><h2 id="refund-heading">Refund review</h2>
      <p>Review cancelled order payments and payments received after checkout expiry.</p></div>
      <button type="button" disabled={busy||query.isFetching} onClick={()=>void refresh()}>Refresh</button></header>
    {error&&<p className={styles.error} role="alert">{error}</p>}
    {query.isPending?<p role="status">Loading refunds…</p>:query.isError?<p className={styles.error} role="alert">{getApiErrorMessage(query.error)}</p>:!query.data?.enabled?
      <p>Refund processing is not available yet. Contact your system administrator.</p>:<>
      <p className={styles.note}>A cancellation does not return money automatically. Confirm each refund below. Refunds marked “Needs attention” or “Unknown” require provider review; do not create a second refund in another system.</p>
      {review&&<div className={styles.review} aria-live="polite"><h3>Confirm full refund</h3><p>{review.payment.orderNumber??'Expired checkout'} · {review.payment.reference}</p>
        <strong>{money(review.quote.amountKobo!)}</strong><p>Returns the full amount charged by Paystack, including any processing fee added to the customer’s payment, to the original payment source.</p>
        <p>{review.quote.domain==='test'?'TEST payment — no real money will move.':'LIVE payment — this action returns real money.'}</p>
        <div className={styles.actions}><button type="button" disabled={busy} onClick={()=>setReview(null)}>Back</button><button type="button" className={styles.primary} disabled={busy} onClick={()=>void submit()}>{busy?'Submitting…':'Confirm refund'}</button></div></div>}
      {!query.data.payments.length?<p>No payments require refund review.</p>:<div className={styles.table}><table><thead><tr><th>Order / payment</th><th>Order amount</th><th>Refund status</th><th>Action</th></tr></thead><tbody>
        {query.data.payments.map(payment=><tr key={payment.id}><td><strong>{payment.orderNumber??'Expired checkout'}</strong><small>{payment.reference}</small>{payment.refund&&<small>Refund: {payment.refund.reference}</small>}</td>
          <td>NGN {payment.principal}{payment.refund&&<small>Full refund: {money(payment.refund.amountKobo)}</small>}</td>
          <td>{payment.refund?.status.replaceAll('_',' ').toLowerCase()??(payment.status==='REFUNDED'?'already refunded':'awaiting review')}</td>
          <td>{payment.refund?payment.refund.status==='PROCESSED'?<span>Provider confirmed</span>:<button type="button" disabled={busy} onClick={()=>void reconcile(payment.id)}>Check provider</button>:payment.status==='PAID'?<button type="button" disabled={busy} onClick={()=>void quote(payment)}>Review refund</button>:<span>Review payment records</span>}</td></tr>)}
      </tbody></table></div>}
      <div className={styles.pagination}><button type="button" disabled={busy||page===1} onClick={()=>{setReview(null);setPage(p=>p-1);}}>Previous</button><span>Page {page}</span><button type="button" disabled={busy||page*query.data.pageSize>=query.data.total} onClick={()=>{setReview(null);setPage(p=>p+1);}}>Next</button></div>
    </>}
  </section>;
}
