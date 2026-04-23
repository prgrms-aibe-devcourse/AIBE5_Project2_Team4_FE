import { buildApiUrl, requestBlob } from './client';

export function getFileViewUrl(fileKey: string): string {
  return buildApiUrl(`/api/v1/files/${fileKey}`);
}

export function getFileDownloadUrl(fileKey: string): string {
  return buildApiUrl(`/api/v1/files/${fileKey}/download`);
}

function revokeObjectUrlLater(objectUrl: string): void {
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function openFileInNewTab(pathOrUrl: string): Promise<void> {
  const popup = window.open('', '_blank');

  try {
    const { blob } = await requestBlob(pathOrUrl);
    const objectUrl = URL.createObjectURL(blob);

    if (popup) {
      popup.opener = null;
      popup.location.href = objectUrl;
    } else {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }

    revokeObjectUrlLater(objectUrl);
  } catch (error) {
    popup?.close();
    throw error;
  }
}

export async function downloadFile(pathOrUrl: string): Promise<void> {
  const { blob, filename } = await requestBlob(pathOrUrl);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filename ?? 'download';
  document.body.append(link);
  link.click();
  link.remove();
  revokeObjectUrlLater(objectUrl);
}
