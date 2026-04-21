import { buildApiUrl } from './client';

export function getFileViewUrl(fileKey: string): string {
  return buildApiUrl(`/api/v1/files/${fileKey}`);
}

export function getFileDownloadUrl(fileKey: string): string {
  return buildApiUrl(`/api/v1/files/${fileKey}/download`);
}
