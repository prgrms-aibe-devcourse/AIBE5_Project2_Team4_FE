import { requestJson } from './client';

export type VerificationType = 'BASIC_IDENTITY' | 'LICENSE' | 'CAREGIVER';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationResponse {
  verificationId: number;
  freelancerProfileId: number;
  type: VerificationType;
  status: VerificationStatus;
  requestMessage?: string | null;
  reviewedByUserId?: number | null;
  requestedAt: string;
  rejectReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationFileResponse {
  verificationFileId: number;
  verificationId: number;
  originalFilename: string;
  contentType?: string | null;
  fileSize?: number | null;
  viewUrl: string;
  downloadUrl: string;
  uploadedAt: string;
}

export function createMyVerification(request: {
  type: VerificationType;
  requestMessage?: string;
}): Promise<VerificationResponse> {
  return requestJson<VerificationResponse>('/api/v1/freelancers/me/verifications', {
    method: 'POST',
    body: request,
  });
}

export function getMyVerifications(): Promise<VerificationResponse[]> {
  return requestJson<VerificationResponse[]>('/api/v1/freelancers/me/verifications');
}

export function getMyVerification(verificationId: number): Promise<VerificationResponse> {
  return requestJson<VerificationResponse>(`/api/v1/freelancers/me/verifications/${verificationId}`);
}

export function uploadVerificationFile(verificationId: number, file: File): Promise<VerificationFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson<VerificationFileResponse>(`/api/v1/freelancers/me/verifications/${verificationId}/files`, {
    method: 'POST',
    body: formData,
  });
}

export function getVerificationFiles(verificationId: number): Promise<VerificationFileResponse[]> {
  return requestJson<VerificationFileResponse[]>(`/api/v1/freelancers/me/verifications/${verificationId}/files`);
}

export function deleteVerificationFile(fileId: number): Promise<void> {
  return requestJson<void>(`/api/v1/freelancers/me/verifications/files/${fileId}`, {
    method: 'DELETE',
  });
}
