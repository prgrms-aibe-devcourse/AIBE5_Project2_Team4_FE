import { requestJson } from './client';
import type { PageResponse } from './types';

export type ProjectStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProjectSummaryResponse {
  projectId: number;
  title: string;
  projectTypeCode: string;
  serviceRegionCode: string;
  requestedStartAt: string;
  requestedEndAt: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailResponse extends ProjectSummaryResponse {
  ownerUserId: number;
  serviceAddress: string;
  serviceDetailAddress?: string | null;
  requestDetail: string;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
}

export interface ProjectCreateRequest {
  title: string;
  projectTypeCode: string;
  serviceRegionCode: string;
  requestedStartAt: string;
  requestedEndAt: string;
  serviceAddress: string;
  serviceDetailAddress?: string;
  requestDetail: string;
}

export interface ProjectUpdateRequest {
  title?: string;
  projectTypeCode?: string;
  serviceRegionCode?: string;
  requestedStartAt?: string;
  requestedEndAt?: string;
  serviceAddress?: string;
  serviceDetailAddress?: string;
  requestDetail?: string;
}

export interface ProjectCreateResponse {
  projectId: number;
  status: ProjectStatus;
}

export interface ProjectCancelResponse {
  projectId: number;
  status: ProjectStatus;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
}

export type ProjectListResponse = PageResponse<ProjectSummaryResponse>;

export function getMyProjects(params: {
  status?: ProjectStatus;
  page?: number;
  size?: number;
} = {}): Promise<ProjectListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<ProjectListResponse>(`/api/v1/projects/me${query ? `?${query}` : ''}`);
}

export function createProject(request: ProjectCreateRequest): Promise<ProjectCreateResponse> {
  return requestJson<ProjectCreateResponse>('/api/v1/projects', {
    method: 'POST',
    body: request,
  });
}

export function getProject(projectId: number): Promise<ProjectDetailResponse> {
  return requestJson<ProjectDetailResponse>(`/api/v1/projects/${projectId}`);
}

export function updateProject(projectId: number, request: ProjectUpdateRequest): Promise<ProjectDetailResponse> {
  return requestJson<ProjectDetailResponse>(`/api/v1/projects/${projectId}`, {
    method: 'PATCH',
    body: request,
  });
}

export function cancelProject(projectId: number, reason: string): Promise<ProjectCancelResponse> {
  return requestJson<ProjectCancelResponse>(`/api/v1/projects/${projectId}/cancel`, {
    method: 'PATCH',
    body: { reason },
  });
}

export function startProject(projectId: number): Promise<ProjectDetailResponse> {
  return requestJson<ProjectDetailResponse>(`/api/v1/projects/${projectId}/start`, {
    method: 'PATCH',
  });
}

export function completeProject(projectId: number): Promise<ProjectDetailResponse> {
  return requestJson<ProjectDetailResponse>(`/api/v1/projects/${projectId}/complete`, {
    method: 'PATCH',
  });
}
