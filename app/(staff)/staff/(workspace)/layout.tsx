import type { ReactNode } from 'react';
import { StaffWorkspace } from '@/components/staff/staff-workspace';

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <StaffWorkspace>{children}</StaffWorkspace>;
}
