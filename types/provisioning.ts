export type ManagedAccountRole =
  | 'BRANCH_MANAGER'
  | 'RIDER';

export type ManagedAccountStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

export interface ManagedAccountSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: ManagedAccountRole;
  status: ManagedAccountStatus;
}

export interface ManagedInvitationHandoff {
  account: ManagedAccountSummary;
  invitationToken: string;
  inviteExpiresAt: string;
}

export interface ManagedInvitation
  extends ManagedInvitationHandoff {
  branch: {
    id: string;
    name: string;
    code: string;
  };
  riderId: string | null;
  replacedManagerId: string | null;
}

export interface ResendManagedInvitation
  extends ManagedInvitationHandoff {
  branchId: string;
  riderId: string | null;
}

export interface ProvisionBranchManagerInput {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  replaceExistingManager?: boolean;
}

export interface ProvisionRiderInput {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
}

export interface AcceptManagedInvitationInput {
  token: string;
  password: string;
}

export interface AcceptManagedInvitationResult {
  account: ManagedAccountSummary;
  branchId: string;
  riderId: string | null;
}

export interface ManagedInvitationResponse {
  success: true;
  message: string;
  data: ManagedInvitation;
}

export interface ResendManagedInvitationResponse {
  success: true;
  message: string;
  data: ResendManagedInvitation;
}

export interface AcceptManagedInvitationResponse {
  success: true;
  message: string;
  data: AcceptManagedInvitationResult;
}