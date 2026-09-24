import {
  api,
} from '@/lib/api/client';

import type {
  InviteStaffInput,
  StaffInvitation,
  StaffInvitationResponse,
  StaffListFilters,
  StaffListResponse,
  StaffMember,
  StaffResponse,
} from '@/types/staff';

export const getStaffMembers =
  async (
    filters: StaffListFilters = {},
  ): Promise<StaffMember[]> => {
    const response =
      await api.get<StaffListResponse>(
        '/staff',
        {
          params: filters,
        },
      );

    return response.data.data.staff;
  };

export const getStaffMember =
  async (
    staffId: string,
  ): Promise<StaffMember> => {
    const response =
      await api.get<StaffResponse>(
        `/staff/${staffId}`,
      );

    return response.data.data.staff;
  };

export const inviteStaffMember =
  async (
    input: InviteStaffInput,
  ): Promise<StaffInvitation> => {
    const response =
      await api.post<StaffInvitationResponse>(
        '/staff/invite',
        input,
      );

    return response.data.data;
  };

export const approveStaffMember =
  async (
    staffId: string,
  ): Promise<StaffMember> => {
    const response =
      await api.patch<StaffResponse>(
        `/staff/${staffId}/approve`,
      );

    return response.data.data.staff;
  };

export const suspendStaffMember =
  async (
    staffId: string,
  ): Promise<StaffMember> => {
    const response =
      await api.patch<StaffResponse>(
        `/staff/${staffId}/suspend`,
      );

    return response.data.data.staff;
  };

export const revokeStaffMember =
  async (
    staffId: string,
  ): Promise<StaffMember> => {
    const response =
      await api.patch<StaffResponse>(
        `/staff/${staffId}/revoke`,
      );

    return response.data.data.staff;
  };
