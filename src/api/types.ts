export interface ApiErrorPayload {
  code?: string;
  errorCode?: string;
  message?: string;
  status?: number;
  path?: string;
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiErrorPayload | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface NotificationPageResponse<T> extends PageResponse<T> {
  unreadCount: number;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly path?: string;

  constructor(message: string, options: { code?: string; status?: number; path?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.status = options.status ?? 500;
    this.path = options.path;
  }
}
