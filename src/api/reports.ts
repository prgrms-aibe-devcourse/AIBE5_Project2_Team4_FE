import { requestJson } from './client';
import type { PageResponse } from './types';

export type ReportReasonType = 'SPAM' | 'ABUSE' | 'FALSE_INFO' | 'ETC';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface ReportCreateRequest {
  reasonType: ReportReasonType;
  reasonDetail?: string;
}

export interface ReportCreateResponse {
  reportId: number;
  reviewId: number;
  reasonType: ReportReasonType;
  status: ReportStatus;
  createdAt: string;
}

export interface ReportSummaryResponse {
  reportId: number;
  reviewId: number;
  reasonType: ReportReasonType;
  reasonDetailSummary?: string | null;
  status: ReportStatus;
  createdAt: string;
  handledAt?: string | null;
  handledBy?: {
    userId: number;
    name: string;
  } | null;
  review: {
    projectId: number;
    projectTitle: string;
    rating: number;
    contentSummary?: string | null;
  };
}

export function createReviewReport(reviewId: number, request: ReportCreateRequest): Promise<ReportCreateResponse> {
  return requestJson<ReportCreateResponse>(`/api/v1/reviews/${reviewId}/reports`, {
    method: 'POST',
    body: request,
  });
}

export function getMyReports(params: {
  status?: ReportStatus;
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<ReportSummaryResponse>> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<PageResponse<ReportSummaryResponse>>(`/api/v1/reports/me${query ? `?${query}` : ''}`);
}
