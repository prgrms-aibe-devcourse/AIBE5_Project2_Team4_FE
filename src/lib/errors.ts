export function getErrorMessage(error: unknown, fallback = '요청 처리에 실패했습니다.'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
