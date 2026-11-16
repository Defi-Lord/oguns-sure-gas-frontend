import { RiderWithdrawalsPanel } from '@/components/admin/finance/rider-withdrawals-panel';
import { RefundPanel } from '@/components/admin/finance/refund-panel';
import {
  FinancePage,
} from '@/components/admin/finance/finance-page';

export default function FinanceRoute() {
  return <><FinancePage /><RiderWithdrawalsPanel /><RefundPanel /></>;
}
