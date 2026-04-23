import { requestJson } from './client';
import type { PageResponse } from './types';

export interface PublicFreelancerSummaryResponse {
  freelancerProfileId: number;
  name: string;
  intro?: string | null;
  caregiverYn: boolean;
  verifiedYn: boolean;
  averageRating?: number | null;
  activityCount?: number | null;
  activityRegionCodes: string[];
  projectTypeCodes: string[];
}

export interface PublicFreelancerDetailResponse extends PublicFreelancerSummaryResponse {
  careerDescription?: string | null;
  availableTimeSlotCodes: string[];
}

export interface FreelancerDetailResponse {
  freelancerProfileId: number;
  userId: number;
  name: string;
  intro?: string | null;
  roleCode: string;
  careerDescription?: string | null;
  caregiverYn: boolean;
  verifiedYn: boolean;
  averageRating?: number | null;
  activityCount?: number | null;
  publicYn: boolean;
  activityRegionCodes: string[];
  availableTimeSlotCodes: string[];
  projectTypeCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerProfileUpsertRequest {
  careerDescription?: string;
  caregiverYn: boolean;
  publicYn: boolean;
  activityRegionCodes: string[];
  availableTimeSlotCodes: string[];
  projectTypeCodes: string[];
}

export interface FreelancerFileResponse {
  fileId: number;
  freelancerProfileId: number;
  originalFilename: string;
  contentType?: string | null;
  fileSize?: number | null;
  displayOrder?: number | null;
  viewUrl: string;
  downloadUrl: string;
  uploadedAt: string;
}

export function getFreelancers(params: {
  keyword?: string;
  projectType?: string;
  region?: string;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<PublicFreelancerSummaryResponse>> {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.projectType) search.set('projectType', params.projectType);
  if (params.region) search.set('region', params.region);
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<PageResponse<PublicFreelancerSummaryResponse>>(`/api/v1/freelancers${query ? `?${query}` : ''}`, {
    auth: false,
  });
}

export function getFreelancer(freelancerProfileId: number): Promise<PublicFreelancerDetailResponse> {
  return requestJson<PublicFreelancerDetailResponse>(`/api/v1/freelancers/${freelancerProfileId}`, {
    auth: false,
  });
}

export function getMyFreelancerProfile(): Promise<FreelancerDetailResponse> {
  return requestJson<FreelancerDetailResponse>('/api/v1/freelancers/me/profile');
}

export function createMyFreelancerProfile(request: FreelancerProfileUpsertRequest): Promise<FreelancerDetailResponse> {
  return requestJson<FreelancerDetailResponse>('/api/v1/freelancers/me/profile', {
    method: 'POST',
    body: request,
  });
}

export function updateMyFreelancerProfile(request: FreelancerProfileUpsertRequest): Promise<FreelancerDetailResponse> {
  return requestJson<FreelancerDetailResponse>('/api/v1/freelancers/me/profile', {
    method: 'PATCH',
    body: request,
  });
}

export function getMyFreelancerFiles(): Promise<FreelancerFileResponse[]> {
  return requestJson<FreelancerFileResponse[]>('/api/v1/freelancers/me/files');
}

export function uploadMyFreelancerFile(file: File): Promise<FreelancerFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson<FreelancerFileResponse>('/api/v1/freelancers/me/files', {
    method: 'POST',
    body: formData,
  });
}

export function deleteMyFreelancerFile(fileId: number): Promise<void> {
  return requestJson<void>(`/api/v1/freelancers/me/files/${fileId}`, {
    method: 'DELETE',
  });
}
