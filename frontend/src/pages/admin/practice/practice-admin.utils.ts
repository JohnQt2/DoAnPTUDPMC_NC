/**
 * Format ISO date string sang giờ địa phương dễ đọc
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Trích xuất lỗi từ error catch của api.ts
 */
export function extractErrorMessage(err: any): { message: string; code?: string; details?: any } {
  if (!err) return { message: 'Đã xảy ra lỗi không xác định.' };
  const data = err.data;
  const message = data?.error?.message || data?.message || err.message || 'Thao tác thất bại.';
  const code = data?.error?.code || data?.code;
  const details = data?.error?.details || data?.details;
  return { message, code, details };
}

/**
 * Debounce helper
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: any = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}
