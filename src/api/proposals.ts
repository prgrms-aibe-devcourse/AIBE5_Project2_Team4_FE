import { requestJson } from './client';
import type { PageResponse } from './types';
import type { ProjectStatus } from './projects';

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface ProjectProposalSummaryResponse {
  proposalId: number;
  projectId: number;
  freelancerProfileId: number;
  freelancer: {
    userId: number;
    name: string;
    verifiedYn?: boolean | null;
    rating?: number | null;
  };
  status: ProposalStatus;
  message?: string | null;
  createdAt: string;
  respondedAt?: string | null;
}

export interface ProposalCreateRequest {
  freelancerProfileId: number;
  message?: string;
}

export interface ProposalCreateResponse {
  proposalId: number;
  projectId: number;
  freelancerProfileId: number;
  status: ProposalStatus;
}

export interface ProposalSummaryResponse {
  proposalId: number;
  projectId: number;
  projectTitle: string;
  ownerUserId: number;
  ownerName?: string | null;
  proposalStatus: ProposalStatus;
  projectStatus: ProjectStatus;
  message?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalDetailResponse {
  proposalId: number;
  projectId: number;
  ownerUserId: number;
  ownerName?: string | null;
  projectTitle: string;
  projectTypeCode: string;
  serviceRegionCode: string;
  requestedStartAt: string;
  requestedEndAt: string;
  serviceAddress: string;
  serviceDetailAddress?: string | null;
  requestDetail: string;
  freelancerProfileId: number;
  freelancerUserId: number;
  freelancerName: string;
  proposalStatus: ProposalStatus;
  projectStatus: ProjectStatus;
  message?: string | null;
  respondedAt?: string | null;
  projectAcceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FreelancerProposalListResponse = PageResponse<ProposalSummaryResponse>;
export type ProjectProposalListResponse = PageResponse<ProjectProposalSummaryResponse>;

export function getProjectProposals(projectId: number, params: {
  status?: ProposalStatus;
  page?: number;
  size?: number;
} = {}): Promise<ProjectProposalListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<ProjectProposalListResponse>(
    `/api/v1/projects/${projectId}/proposals${query ? `?${query}` : ''}`,
  );
}

export function createProposal(projectId: number, request: ProposalCreateRequest): Promise<ProposalCreateResponse> {
  return requestJson<ProposalCreateResponse>(`/api/v1/projects/${projectId}/proposals`, {
    method: 'POST',
    body: request,
  });
}

export function getMyFreelancerProposals(params: {
  status?: ProposalStatus;
  projectStatus?: ProjectStatus;
  page?: number;
  size?: number;
} = {}): Promise<FreelancerProposalListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.projectStatus) search.set('projectStatus', params.projectStatus);
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<FreelancerProposalListResponse>(
    `/api/v1/freelancers/me/proposals${query ? `?${query}` : ''}`,
  );
}

export function getMyFreelancerProposal(proposalId: number): Promise<ProposalDetailResponse> {
  return requestJson<ProposalDetailResponse>(`/api/v1/freelancers/me/proposals/${proposalId}`);
}

export function acceptProposal(proposalId: number): Promise<ProposalDetailResponse> {
  return requestJson<ProposalDetailResponse>(`/api/v1/freelancers/me/proposals/${proposalId}/accept`, {
    method: 'PATCH',
  });
}

export function rejectProposal(proposalId: number): Promise<ProposalDetailResponse> {
  return requestJson<ProposalDetailResponse>(`/api/v1/freelancers/me/proposals/${proposalId}/reject`, {
    method: 'PATCH',
  });
}
