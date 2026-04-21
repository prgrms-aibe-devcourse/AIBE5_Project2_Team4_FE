import { requestJson } from './client';

export interface UserProfileResponse {
  userId: number;
  email: string;
  name: string;
  phone?: string | null;
  intro?: string | null;
  roleCode: string;
  active: boolean;
}

export interface UserProfileUpdateRequest {
  name?: string;
  phone?: string;
  intro?: string;
}

export interface UserMyPageResponse {
  user: {
    userId: number;
    email: string;
    name: string;
    phone?: string | null;
    intro?: string | null;
    roleCode: string;
    activeYn: boolean;
  };
  projectStats: {
    totalProjects: number;
    requestedProjects: number;
    acceptedProjects: number;
    inProgressProjects: number;
    completedProjects: number;
    cancelledProjects: number;
  };
  reviewStats: {
    writtenReviewCount: number;
    reportedCount: number;
  };
  notificationSummary: {
    unreadNotificationCount: number;
  };
  freelancerProfile?: {
    freelancerProfileId: number;
    verifiedYn: boolean;
    publicYn: boolean;
    caregiverYn: boolean;
    averageRating?: number | null;
    activityCount?: number | null;
  } | null;
  verificationSummary?: {
    verificationId: number;
    type: string;
    status: string;
    requestedAt?: string | null;
    reviewedAt?: string | null;
    rejectReason?: string | null;
  } | null;
  proposalSummary?: {
    receivedProposalCount: number;
    pendingReceivedProposalCount: number;
  } | null;
}

export function getMyProfile(): Promise<UserProfileResponse> {
  return requestJson<UserProfileResponse>('/api/v1/users/me');
}

export function updateMyProfile(request: UserProfileUpdateRequest): Promise<UserProfileResponse> {
  return requestJson<UserProfileResponse>('/api/v1/users/me', {
    method: 'PATCH',
    body: request,
  });
}

export function getMyPage(): Promise<UserMyPageResponse> {
  return requestJson<UserMyPageResponse>('/api/v1/users/me/mypage');
}
