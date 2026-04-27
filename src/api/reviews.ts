import { requestJson } from './client';
import type { PageResponse } from './types';

export interface ReviewTagCodeResponse {
  code: string;
  name: string;
  sortOrder?: number | null;
}

export interface ReviewSummaryResponse {
  reviewId: number;
  projectId: number;
  projectTitle: string;
  freelancerProfileId?: number | null;
  freelancerName?: string | null;
  reviewerUserId: number;
  reviewerName?: string | null;
  reviewDirection?: string | null;
  revieweeUserId?: number | null;
  revieweeName?: string | null;
  revieweeRoleCode?: string | null;
  rating: number;
  tagCodes: string[];
  content: string;
  blindedYn: boolean;
  reported: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReviewDetailResponse = ReviewSummaryResponse;

export interface ReviewCreateRequest {
  rating: number;
  tagCodes: string[];
  content: string;
}

export interface ReviewDeleteResponse {
  reviewId: number;
  deleted: boolean;
}

export function createProjectReview(projectId: number, request: ReviewCreateRequest): Promise<ReviewDetailResponse> {
  return requestJson<ReviewDetailResponse>(`/api/v1/projects/${projectId}/reviews`, {
    method: 'POST',
    body: request,
  });
}

export function createRequesterReview(projectId: number, request: ReviewCreateRequest): Promise<ReviewDetailResponse> {
  return requestJson<ReviewDetailResponse>(`/api/v1/projects/${projectId}/requester-reviews`, {
    method: 'POST',
    body: request,
  });
}

export function getMyReviews(params: { page?: number; size?: number } = {}): Promise<PageResponse<ReviewSummaryResponse>> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<PageResponse<ReviewSummaryResponse>>(`/api/v1/users/me/reviews${query ? `?${query}` : ''}`);
}

export function getMyReceivedReviews(params: { page?: number; size?: number } = {}): Promise<PageResponse<ReviewSummaryResponse>> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<PageResponse<ReviewSummaryResponse>>(`/api/v1/users/me/received-reviews${query ? `?${query}` : ''}`);
}

export function getMyReview(reviewId: number): Promise<ReviewDetailResponse> {
  return requestJson<ReviewDetailResponse>(`/api/v1/users/me/reviews/${reviewId}`);
}

export function updateMyReview(reviewId: number, request: ReviewCreateRequest): Promise<ReviewDetailResponse> {
  return requestJson<ReviewDetailResponse>(`/api/v1/users/me/reviews/${reviewId}`, {
    method: 'PATCH',
    body: request,
  });
}

export function deleteMyReview(reviewId: number): Promise<ReviewDeleteResponse> {
  return requestJson<ReviewDeleteResponse>(`/api/v1/users/me/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}

export function getFreelancerReviews(
  freelancerProfileId: number,
  params: { page?: number; size?: number } = {},
): Promise<PageResponse<ReviewSummaryResponse>> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<PageResponse<ReviewSummaryResponse>>(
    `/api/v1/freelancers/${freelancerProfileId}/reviews${query ? `?${query}` : ''}`,
    { auth: false },
  );
}

export function getReviewTagCodes(): Promise<ReviewTagCodeResponse[]> {
  return requestJson<ReviewTagCodeResponse[]>('/api/v1/reviews/tag-codes', { auth: false });
}
