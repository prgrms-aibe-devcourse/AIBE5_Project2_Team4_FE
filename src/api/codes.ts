import { requestJson } from './client';

export interface CodeLookupResponse {
  code: string;
  name: string;
  sortOrder?: number | null;
  parentRegionCode?: string | null;
  regionLevel?: number | null;
  startMinute?: number | null;
  endMinute?: number | null;
}

export function getProjectTypeCodes(): Promise<CodeLookupResponse[]> {
  return requestJson<CodeLookupResponse[]>('/api/v1/codes/project-types', { auth: false });
}

export function getRegionCodes(): Promise<CodeLookupResponse[]> {
  return requestJson<CodeLookupResponse[]>('/api/v1/codes/regions', { auth: false });
}

export function getAvailableTimeSlotCodes(): Promise<CodeLookupResponse[]> {
  return requestJson<CodeLookupResponse[]>('/api/v1/codes/available-time-slots', { auth: false });
}
