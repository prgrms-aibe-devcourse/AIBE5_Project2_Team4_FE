import { getAccessToken, getRefreshToken } from '../auth/tokenStorage';
import { ApiError, type ApiResponse } from './types';

type PrimitiveBody = BodyInit | null | undefined;

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
  retryOnAuthFailure?: boolean;
}

export interface ApiBlobResponse {
  blob: Blob;
  filename?: string;
  contentType?: string;
}

let unauthorizedHandler: (() => Promise<boolean>) | null = null;

export function registerUnauthorizedHandler(handler: (() => Promise<boolean>) | null): void {
  unauthorizedHandler = handler;
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveApiAssetUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) {
    return undefined;
  }

  return buildApiUrl(pathOrUrl);
}

function isFormData(body: RequestOptions['body']): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isPrimitiveBody(body: RequestOptions['body']): body is PrimitiveBody {
  return typeof body === 'string'
    || body instanceof Blob
    || body instanceof URLSearchParams
    || body instanceof ArrayBuffer
    || ArrayBuffer.isView(body)
    || body == null;
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);

  if (options.auth !== false) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return headers;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function toApiError(response: Response, payload: unknown, requestPath: string): ApiError {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const apiPayload = payload as ApiResponse<unknown>;
    const error = apiPayload.error;
    return new ApiError(error?.message ?? response.statusText, {
      code: error?.code ?? error?.errorCode,
      status: error?.status ?? response.status,
      path: error?.path ?? requestPath,
    });
  }

  if (payload && typeof payload === 'object') {
    const error = payload as { message?: string; code?: string; status?: number; path?: string };
    return new ApiError(error.message ?? response.statusText, {
      code: error.code,
      status: error.status ?? response.status,
      path: error.path ?? requestPath,
    });
  }

  return new ApiError(typeof payload === 'string' && payload ? payload : response.statusText, {
    status: response.status,
    path: requestPath,
  });
}

function parseFilenameFromContentDisposition(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) {
    return undefined;
  }

  const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedFilename) {
    try {
      return decodeURIComponent(encodedFilename.trim().replace(/^"|"$/g, ''));
    } catch {
      return encodedFilename;
    }
  }

  const quotedFilename = contentDisposition.match(/filename="([^"]+)"/i)?.[1];
  if (quotedFilename) {
    return quotedFilename;
  }

  return contentDisposition.match(/filename=([^;]+)/i)?.[1]?.trim();
}

function buildRequestInit(options: RequestOptions): RequestInit {
  const headers = buildHeaders(options);
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (options.body !== undefined) {
    if (isFormData(options.body)) {
      init.body = options.body;
    } else if (isPrimitiveBody(options.body)) {
      init.body = options.body ?? null;
    } else {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(options.body);
    }
  }

  return init;
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestPath = path.startsWith('http') ? new URL(path).pathname : path;
  const init = buildRequestInit(options);

  const response = await fetch(buildApiUrl(path), init);

  if (response.status === 401 && options.retryOnAuthFailure !== false && unauthorizedHandler && getRefreshToken()) {
    const refreshed = await unauthorizedHandler();
    if (refreshed) {
      return requestJson<T>(path, { ...options, retryOnAuthFailure: false });
    }
  }

  const payload = response.headers.get('content-type')?.includes('application/json')
    ? await parseJson(response)
    : await response.text();

  if (!response.ok) {
    throw toApiError(response, payload, requestPath);
  }

  if (payload == null || payload === '') {
    return undefined as T;
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    const apiPayload = payload as ApiResponse<T>;
    if (!apiPayload.success) {
      throw toApiError(response, payload, requestPath);
    }

    return apiPayload.data;
  }

  return payload as T;
}

export async function requestBlob(path: string, options: RequestOptions = {}): Promise<ApiBlobResponse> {
  const requestPath = path.startsWith('http') ? new URL(path).pathname : path;
  const response = await fetch(buildApiUrl(path), buildRequestInit(options));

  if (response.status === 401 && options.retryOnAuthFailure !== false && unauthorizedHandler && getRefreshToken()) {
    const refreshed = await unauthorizedHandler();
    if (refreshed) {
      return requestBlob(path, { ...options, retryOnAuthFailure: false });
    }
  }

  if (!response.ok) {
    const payload = response.headers.get('content-type')?.includes('application/json')
      ? await parseJson(response)
      : await response.text();
    throw toApiError(response, payload, requestPath);
  }

  return {
    blob: await response.blob(),
    filename: parseFilenameFromContentDisposition(response.headers.get('content-disposition')),
    contentType: response.headers.get('content-type') ?? undefined,
  };
}
