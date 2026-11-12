import {
  api,
} from '@/lib/api/client';

import type {
  AcceptManagedInvitationInput,
  AcceptManagedInvitationResponse,
  AcceptManagedInvitationResult,
  ManagedAccountSummary,
  ManagedInvitation,
  ManagedInvitationResponse,
  ProvisionBranchManagerInput,
  ProvisionRiderInput,
  ResendManagedInvitation,
  ResendManagedInvitationResponse,
} from '@/types/provisioning';

export const provisionBranchManager =
  async (
    input:
      ProvisionBranchManagerInput,
  ): Promise<ManagedInvitation> => {
    const response =
      await api.post<ManagedInvitationResponse>(
        '/provisioning/branch-managers',
        input,
      );

    return response.data.data;
  };

export const provisionRider =
  async (
    input:
      ProvisionRiderInput,
  ): Promise<ManagedInvitation> => {
    const response =
      await api.post<ManagedInvitationResponse>(
        '/provisioning/riders',
        input,
      );

    return response.data.data;
  };

export const resendManagedInvitation =
  async (
    userId: string,
  ): Promise<ResendManagedInvitation> => {
    const response =
      await api.post<ResendManagedInvitationResponse>(
        `/provisioning/users/${userId}/resend`,
        {},
      );

    return response.data.data;
  };

export const acceptManagedInvitation =
  async (
    input:
      AcceptManagedInvitationInput,
  ): Promise<AcceptManagedInvitationResult> => {
    const response =
      await api.post<AcceptManagedInvitationResponse>(
        '/provisioning/accept',
        input,
      );

    return response.data.data;
  };

export async function approveManagedAccount(userId: string): Promise<ManagedAccountSummary> {
  const response = await api.post<{ data: ManagedAccountSummary }>(
    `/provisioning/users/${userId}/approve`,
    {},
  );
  return response.data.data;
}
