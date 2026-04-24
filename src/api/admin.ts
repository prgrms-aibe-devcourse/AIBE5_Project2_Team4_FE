import { requestJson } from './client';
import type { PageResponse } from './types';
import type { ProjectStatus } from './projects';
import type { ReportReasonType, ReportStatus } from './reports';
import type { VerificationStatus, VerificationType } from './verifications';

export interface AdminUserSummaryResponse {
  userId: number;
  name: string;
  email: string;
  roleCode: string;
  activeYn: boolean;
}

export interface AdminFreelancerSummaryResponse {
  freelancerProfileId: number;
  userId: number;
  name: string;
  email: string;
  verifiedYn: boolean;
  publicYn: boolean;
  activeYn: boolean;
}

export interface AdminDashboardResponse {
  totalUsers: number;
  totalFreelancers: number;
  verifiedFreelancers: number;
  pendingVerifications: number;
  requestedProjects: number;
  acceptedProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  pendingReports: number;
  blindedReviews: number;
  publishedNotices: number;
  recentPendingVerifications: Array<{
    verificationId: number;
    freelancerProfileId: number;
    applicantName: string;
    verificationType: string;
    requestedAt: string;
  }>;
  recentReports: Array<{
    reportId: number;
    reviewId: number;
    reporterName: string;
    reasonType: ReportReasonType;
    createdAt: string;
  }>;
  recentProjects: Array<{
    projectId: number;
    title: string;
    status: ProjectStatus;
    ownerName: string;
    createdAt: string;
  }>;
}

export interface AdminVerificationListItemResponse {
  verificationId: number;
  freelancerProfileId: number;
  userId: number;
  applicantName: string;
  applicantEmail: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  descriptionSummary?: string | null;
  hasFiles: boolean;
  requestedAt: string;
  reviewedAt?: string | null;
}

export interface AdminVerificationDetailResponse {
  verificationId: number;
  freelancerProfileId: number;
  freelancer: AdminFreelancerSummaryResponse;
  verificationType: VerificationType;
  status: VerificationStatus;
  description?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: AdminUserSummaryResponse | null;
  rejectReason?: string | null;
  files: Array<{
    verificationFileId: number;
    originalName: string;
    storedName: string;
    contentType?: string | null;
    fileSize?: number | null;
    viewUrl: string;
    downloadUrl: string;
    uploadedAt: string;
  }>;
}

export interface AdminProjectSummaryResponse {
  projectId: number;
  title: string;
  projectTypeCode: string;
  status: ProjectStatus;
  owner: AdminUserSummaryResponse;
  acceptedFreelancer?: AdminFreelancerSummaryResponse | null;
  requestedStartAt: string;
  requestedEndAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProjectDetailResponse {
  projectId: number;
  title: string;
  projectTypeCode: string;
  serviceRegionCode: string;
  requestedStartAt: string;
  requestedEndAt: string;
  serviceAddress: string;
  serviceDetailAddress?: string | null;
  requestDetail: string;
  status: ProjectStatus;
  owner: AdminUserSummaryResponse;
  acceptedProposal?: {
    proposalId: number;
    freelancer: AdminFreelancerSummaryResponse;
    message?: string | null;
    respondedAt?: string | null;
  } | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFreelancerListItemResponse {
  freelancerProfileId: number;
  userId: number;
  name: string;
  email: string;
  verifiedYn: boolean;
  publicYn: boolean;
  activeYn: boolean;
  averageRating?: number | null;
  activityCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFreelancerDetailResponse {
  freelancerProfileId: number;
  userId: number;
  name: string;
  email: string;
  roleCode: string;
  activeYn: boolean;
  intro?: string | null;
  careerDescription?: string | null;
  caregiverYn: boolean;
  verifiedYn: boolean;
  publicYn: boolean;
  averageRating?: number | null;
  activityCount?: number | null;
  activityRegionCodes: string[];
  availableTimeSlotCodes: string[];
  projectTypeCodes: string[];
  recentVerifications: Array<{
    verificationId: number;
    verificationType: VerificationType;
    status: VerificationStatus;
    requestedAt: string;
    reviewedAt?: string | null;
    rejectReason?: string | null;
  }>;
  portfolioFiles: Array<{
    verificationFileId: number;
    originalName: string;
    contentType?: string | null;
    fileSize?: number | null;
    viewUrl: string;
    downloadUrl: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFreelancerStateResponse {
  freelancerProfileId: number;
  publicYn: boolean;
  activeYn: boolean;
  verifiedYn: boolean;
}

export interface AdminReviewListItemResponse {
  reviewId: number;
  projectId: number;
  projectTitle: string;
  writer: AdminUserSummaryResponse;
  targetFreelancer: AdminFreelancerSummaryResponse;
  rating: number;
  blindedYn: boolean;
  createdAt: string;
}

export interface AdminReviewVisibilityResponse {
  reviewId: number;
  blindedYn: boolean;
}

export interface AdminReportListItemResponse {
  reportId: number;
  reviewId: number;
  reporter: AdminUserSummaryResponse;
  reasonType: ReportReasonType;
  status: ReportStatus;
  createdAt: string;
  handledAt?: string | null;
  handledBy?: AdminUserSummaryResponse | null;
}

export interface AdminReportDetailResponse {
  reportId: number;
  reasonType: ReportReasonType;
  reasonDetail?: string | null;
  status: ReportStatus;
  createdAt: string;
  handledAt?: string | null;
  reporter: AdminUserSummaryResponse;
  handledBy?: AdminUserSummaryResponse | null;
  review: {
    reviewId: number;
    projectId: number;
    projectTitle: string;
    rating: number;
    blindedYn: boolean;
    writer: AdminUserSummaryResponse;
    targetFreelancer: AdminFreelancerSummaryResponse;
    createdAt: string;
  };
}

export interface AdminNoticeResponse {
  noticeId: number;
  title: string;
  content: string;
  publishedYn: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  admin: AdminUserSummaryResponse;
}

export interface AdminNoticeUpdateRequest {
  title: string;
  content: string;
}

function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getAdminDashboard(): Promise<AdminDashboardResponse> {
  return requestJson<AdminDashboardResponse>('/api/v1/admin/dashboard');
}

export function getAdminVerifications(params: {
  status?: VerificationStatus;
  verificationType?: VerificationType;
  keyword?: string;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<AdminVerificationListItemResponse>> {
  return requestJson<PageResponse<AdminVerificationListItemResponse>>(
    `/api/v1/admin/verifications${toQuery(params)}`,
  );
}

export function getAdminVerification(verificationId: number): Promise<AdminVerificationDetailResponse> {
  return requestJson<AdminVerificationDetailResponse>(`/api/v1/admin/verifications/${verificationId}`);
}

export function approveAdminVerification(verificationId: number, reviewComment?: string): Promise<AdminVerificationDetailResponse> {
  return requestJson<AdminVerificationDetailResponse>(`/api/v1/admin/verifications/${verificationId}/approve`, {
    method: 'PATCH',
    body: reviewComment ? { reviewComment } : {},
  });
}

export function rejectAdminVerification(verificationId: number, reviewComment: string): Promise<AdminVerificationDetailResponse> {
  return requestJson<AdminVerificationDetailResponse>(`/api/v1/admin/verifications/${verificationId}/reject`, {
    method: 'PATCH',
    body: { reviewComment },
  });
}

export function getAdminProjects(params: {
  status?: ProjectStatus;
  keyword?: string;
  writerKeyword?: string;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<AdminProjectSummaryResponse>> {
  return requestJson<PageResponse<AdminProjectSummaryResponse>>(`/api/v1/admin/projects${toQuery(params)}`);
}

export function getAdminProject(projectId: number): Promise<AdminProjectDetailResponse> {
  return requestJson<AdminProjectDetailResponse>(`/api/v1/admin/projects/${projectId}`);
}

export function cancelAdminProject(projectId: number, reason: string): Promise<AdminProjectDetailResponse> {
  return requestJson<AdminProjectDetailResponse>(`/api/v1/admin/projects/${projectId}/cancel`, {
    method: 'PATCH',
    body: { reason },
  });
}

export function getAdminFreelancers(params: {
  verified?: boolean;
  keyword?: string;
  region?: string;
  projectType?: string;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<AdminFreelancerListItemResponse>> {
  return requestJson<PageResponse<AdminFreelancerListItemResponse>>(`/api/v1/admin/freelancers${toQuery(params)}`);
}

export function getAdminFreelancer(freelancerProfileId: number): Promise<AdminFreelancerDetailResponse> {
  return requestJson<AdminFreelancerDetailResponse>(`/api/v1/admin/freelancers/${freelancerProfileId}`);
}

export function updateAdminFreelancerVisibility(
  freelancerProfileId: number,
  publicYn: boolean,
): Promise<AdminFreelancerStateResponse> {
  return requestJson<AdminFreelancerStateResponse>(`/api/v1/admin/freelancers/${freelancerProfileId}/visibility`, {
    method: 'PATCH',
    body: { publicYn },
  });
}

export function updateAdminFreelancerActive(
  freelancerProfileId: number,
  activeYn: boolean,
): Promise<AdminFreelancerStateResponse> {
  return requestJson<AdminFreelancerStateResponse>(`/api/v1/admin/freelancers/${freelancerProfileId}/active`, {
    method: 'PATCH',
    body: { activeYn },
  });
}

export function getAdminReviews(params: {
  blinded?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<AdminReviewListItemResponse>> {
  return requestJson<PageResponse<AdminReviewListItemResponse>>(`/api/v1/admin/reviews${toQuery(params)}`);
}

export function blindAdminReview(reviewId: number, reason: string): Promise<AdminReviewVisibilityResponse> {
  return requestJson<AdminReviewVisibilityResponse>(`/api/v1/admin/reviews/${reviewId}/blind`, {
    method: 'PATCH',
    body: { reason },
  });
}

export function unblindAdminReview(reviewId: number): Promise<AdminReviewVisibilityResponse> {
  return requestJson<AdminReviewVisibilityResponse>(`/api/v1/admin/reviews/${reviewId}/unblind`, {
    method: 'PATCH',
  });
}

export function getAdminReports(params: {
  status?: ReportStatus;
  reasonType?: ReportReasonType;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<AdminReportListItemResponse>> {
  return requestJson<PageResponse<AdminReportListItemResponse>>(`/api/v1/admin/reports${toQuery(params)}`);
}

export function getAdminReport(reportId: number): Promise<AdminReportDetailResponse> {
  return requestJson<AdminReportDetailResponse>(`/api/v1/admin/reports/${reportId}`);
}

export function resolveAdminReport(reportId: number): Promise<AdminReportDetailResponse> {
  return requestJson<AdminReportDetailResponse>(`/api/v1/admin/reports/${reportId}/resolve`, {
    method: 'PATCH',
  });
}

export function rejectAdminReport(reportId: number): Promise<AdminReportDetailResponse> {
  return requestJson<AdminReportDetailResponse>(`/api/v1/admin/reports/${reportId}/reject`, {
    method: 'PATCH',
  });
}

export function createAdminNotice(request: {
  title: string;
  content: string;
  publishNow?: boolean;
}): Promise<AdminNoticeResponse> {
  return requestJson<AdminNoticeResponse>('/api/v1/admin/notices', {
    method: 'POST',
    body: request,
  });
}

export function updateAdminNotice(
  noticeId: number,
  request: AdminNoticeUpdateRequest,
): Promise<AdminNoticeResponse> {
  return requestJson<AdminNoticeResponse>(`/api/v1/admin/notices/${noticeId}`, {
    method: 'PATCH',
    body: request,
  });
}

export function deleteAdminNotice(noticeId: number): Promise<void> {
  return requestJson<void>(`/api/v1/admin/notices/${noticeId}`, {
    method: 'DELETE',
  });
}

export function publishAdminNotice(noticeId: number): Promise<AdminNoticeResponse> {
  return requestJson<AdminNoticeResponse>(`/api/v1/admin/notices/${noticeId}/publish`, {
    method: 'PATCH',
  });
}
