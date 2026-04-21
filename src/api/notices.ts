import { requestJson } from './client';
import type { PageResponse } from './types';

export interface NoticeSummaryResponse {
  noticeId: number;
  title: string;
  publishedAt: string;
  createdAt: string;
}

export interface NoticeDetailResponse {
  noticeId: number;
  title: string;
  content: string;
  publishedAt: string;
}

export function getNotices(params: { page?: number; size?: number } = {}): Promise<PageResponse<NoticeSummaryResponse>> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const query = search.toString();
  return requestJson<PageResponse<NoticeSummaryResponse>>(`/api/v1/notices${query ? `?${query}` : ''}`, {
    auth: false,
  });
}

export function getNotice(noticeId: number): Promise<NoticeDetailResponse> {
  return requestJson<NoticeDetailResponse>(`/api/v1/notices/${noticeId}`, { auth: false });
}
