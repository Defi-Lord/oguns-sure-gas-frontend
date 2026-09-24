export type StaffStatus =
  | 'PENDING_INVITE'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED';

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'STAFF';
  status: string;
}

export interface StaffBranch {
  id: string;
  name: string;
  code: string;
}

export interface StaffActor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface StaffMember {
  id: string;
  userId: string;
  branchId: string;
  jobTitle: string | null;
  status: StaffStatus;

  invitedAt: string;
  inviteExpiresAt: string | null;
  acceptedAt: string | null;
  approvedAt: string | null;
  revokedAt: string | null;

  createdAt: string;
  updatedAt: string;

  user: StaffUser;
  branch: StaffBranch;
  createdBy: StaffActor;
  approvedBy: StaffActor | null;
}

export interface InviteStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  branchId: string;
  jobTitle?: string;
}

export interface StaffListFilters {
  branchId?: string;
  status?: StaffStatus;
}

export interface StaffListResponse {
  success: boolean;
  message: string;

  data: {
    staff: StaffMember[];
  };
}

export interface StaffResponse {
  success: boolean;
  message: string;

  data: {
    staff: StaffMember;
  };
}

export interface StaffInvitation {
  staff: StaffMember;
  invitationToken: string;
  inviteExpiresAt: string;
}

export interface StaffInvitationResponse {
  success: boolean;
  message: string;
  data: StaffInvitation;
}
