// In-memory Access Token storage (never persisted to localStorage/sessionStorage to prevent XSS theft).
// Refresh Token is managed strictly via HttpOnly Cookie with 30-day Sliding Expiration & RTR.
let inMemoryAccessToken: string | null = null;
let inFlightRefreshPromise: Promise<string | null> | null = null;
let autoRefreshTimer: number | null = null;
let lastRefreshedAt = 0;

const API_BASE = '/api/v1';
const PROACTIVE_REFRESH_LEAD_MS = 3.5 * 60 * 1000; // Refresh silently ~3.5 minutes before 1h expiry (2–5 min window)
const NETWORK_RETRY_DELAY_MS = 30 * 1000;

// Cross-tab auth synchronization so multiple open tabs never race on Refresh Token Rotation
const authChannel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('hanzi4u_auth_sync')
    : null;

if (authChannel) {
  authChannel.onmessage = (event) => {
    const payload = event.data;
    if (!payload || typeof payload !== 'object') return;
    if (payload.type === 'TOKEN_REFRESHED' && typeof payload.accessToken === 'string') {
      applyAccessToken(payload.accessToken, false);
    } else if (payload.type === 'LOGOUT') {
      clearAccessTokenInternal(false);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  };
}

/**
 * Decode JWT payload `exp` claim (in milliseconds) without external libraries.
 */
export function getTokenExpiryMs(token: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(atob(padded));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getAccessTokenRemainingMs(): number {
  const expMs = getTokenExpiryMs(inMemoryAccessToken);
  if (!expMs) return 0;
  return expMs - Date.now();
}

export function isAccessTokenExpiringSoon(leadMs = 5 * 60 * 1000): boolean {
  if (!inMemoryAccessToken) return false;
  const remaining = getAccessTokenRemainingMs();
  return remaining <= leadMs;
}

function clearAutoRefreshTimer() {
  if (autoRefreshTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function scheduleProactiveRefresh(token: string) {
  clearAutoRefreshTimer();
  if (typeof window === 'undefined') return;

  const expMs = getTokenExpiryMs(token);
  if (!expMs) return;

  const remainingMs = expMs - Date.now();
  // Aim to refresh ~3.5 mins before expiry (or at 10% remaining TTL for short-lived test tokens)
  const leadMs = Math.min(PROACTIVE_REFRESH_LEAD_MS, Math.max(15_000, Math.floor(remainingMs * 0.1)));
  const delayMs = Math.max(5_000, remainingMs - leadMs);

  autoRefreshTimer = window.setTimeout(() => {
    void silentRefreshAccessToken({ notifyOnFail: true });
  }, delayMs);
}

function applyAccessToken(token: string | null, broadcast: boolean) {
  inMemoryAccessToken = token;
  if (token) {
    lastRefreshedAt = Date.now();
    scheduleProactiveRefresh(token);
    if (broadcast && authChannel) {
      try {
        authChannel.postMessage({ type: 'TOKEN_REFRESHED', accessToken: token });
      } catch {
        // Ignore closed channel
      }
    }
  } else {
    clearAutoRefreshTimer();
  }
}

function clearAccessTokenInternal(broadcast: boolean) {
  inMemoryAccessToken = null;
  clearAutoRefreshTimer();
  if (broadcast && authChannel) {
    try {
      authChannel.postMessage({ type: 'LOGOUT' });
    } catch {
      // Ignore closed channel
    }
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  applyAccessToken(token, true);
}

export function clearAccessToken(broadcast = false): void {
  clearAccessTokenInternal(broadcast);
}

/**
 * Single-flight silent refresh using the HttpOnly Refresh Token cookie.
 * - Deduplicates concurrent refreshes so RTR never collides across parallel API calls.
 * - Preserves in-progress lessons/exams on transient network hiccups by retrying quietly instead of logging out.
 */
export async function silentRefreshAccessToken(options?: {
  notifyOnFail?: boolean;
  force?: boolean;
}): Promise<string | null> {
  const notifyOnFail = options?.notifyOnFail ?? false;

  // If another tab or request refreshed successfully within the last 3 seconds, reuse that fresh token
  if (!options?.force && inMemoryAccessToken && Date.now() - lastRefreshedAt < 3_000 && !isAccessTokenExpiringSoon(60_000)) {
    return inMemoryAccessToken;
  }

  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json().catch(() => null);
        const newToken: string | null = refreshData?.data?.accessToken || null;
        if (newToken) {
          applyAccessToken(newToken, true);
          return newToken;
        }
      }

      // Only terminate session when the server explicitly rejects the refresh cookie (401/403).
      // Transient 5xx errors keep the user in their lesson/exam and retry shortly.
      if (refreshRes.status === 401 || refreshRes.status === 403) {
        clearAccessTokenInternal(false);
        if (notifyOnFail && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return null;
      }

      // Transient server error -> retry quietly in background without interrupting active study/exam
      if (inMemoryAccessToken && typeof window !== 'undefined') {
        clearAutoRefreshTimer();
        autoRefreshTimer = window.setTimeout(() => {
          void silentRefreshAccessToken({ notifyOnFail: true });
        }, NETWORK_RETRY_DELAY_MS);
      }
      return inMemoryAccessToken;
    } catch {
      // Transient offline / Wi-Fi blip -> do NOT force-logout mid-exam; retry silently after 30s
      if (inMemoryAccessToken && typeof window !== 'undefined') {
        clearAutoRefreshTimer();
        autoRefreshTimer = window.setTimeout(() => {
          void silentRefreshAccessToken({ notifyOnFail: true });
        }, NETWORK_RETRY_DELAY_MS);
      }
      return inMemoryAccessToken;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

const SKIP_REFRESH_ENDPOINTS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/otp/',
  '/auth/password/',
  '/auth/google',
];

function shouldSkipAutoRefresh(endpoint: string): boolean {
  return SKIP_REFRESH_ENDPOINTS.some((prefix) => endpoint.includes(prefix));
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) searchParams.append(key, String(val));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Pre-flight proactive refresh: if token is < 90s from expiry before a request (e.g. exam submit),
  // refresh silently BEFORE sending so the request succeeds without a 401 round-trip.
  if (
    inMemoryAccessToken &&
    !shouldSkipAutoRefresh(endpoint) &&
    isAccessTokenExpiringSoon(90_000)
  ) {
    await silentRefreshAccessToken({ notifyOnFail: false });
  }

  const isFormData = typeof FormData !== 'undefined' && customConfig.body instanceof FormData;
  const reqHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  };

  if (inMemoryAccessToken) {
    reqHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const controller = new AbortController();
  const timeoutId =
    typeof window !== 'undefined' ? window.setTimeout(() => controller.abort(), 20_000) : null;

  const config: RequestInit = {
    ...customConfig,
    headers: reqHeaders,
    credentials: 'include', // Send HttpOnly refresh cookie automatically
    signal: customConfig.signal || controller.signal,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    const isAbort = err?.name === 'AbortError';
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const friendlyMsg = isOffline
      ? 'Thiết bị đang mất kết nối Internet. Vui lòng kiểm tra Wi-Fi hoặc 4G rồi thử lại.'
      : isAbort
        ? 'Máy chủ phản hồi quá lâu (hết thời gian chờ). Vui lòng thử lại sau ít giây.'
        : 'Không thể kết nối tới máy chủ Hanzi4U. Có thể máy chủ đang khởi động lại hoặc bạn vừa bấm quá nhanh — vui lòng chờ vài giây rồi thử lại.';
    const netError = new Error(friendlyMsg);
    (netError as any).status = 0;
    (netError as any).data = {
      error: {
        code: isOffline ? 'OFFLINE' : isAbort ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
        message: friendlyMsg,
      },
    };
    throw netError;
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }

  // If 401 Unauthorized, perform single-flight Silent Token Refresh and transparently retry
  if (response.status === 401 && !shouldSkipAutoRefresh(endpoint)) {
    const newToken = await silentRefreshAccessToken({ notifyOnFail: true, force: true });
    if (newToken) {
      reqHeaders['Authorization'] = `Bearer ${newToken}`;
      try {
        response = await fetch(url, { ...config, headers: reqHeaders, signal: customConfig.signal });
      } catch {
        throw new Error('Kết nối tới máy chủ bị gián đoạn. Vui lòng thử lại sau ít giây.');
      }
    } else {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const retryHeader =
      response.headers.get('Retry-After') || response.headers.get('X-RateLimit-Reset');
    const retrySeconds = retryHeader ? parseInt(retryHeader, 10) : NaN;
    const validRetry = Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds : undefined;

    let fallbackMsg = `Yêu cầu không thành công (mã ${response.status}). Vui lòng thử lại.`;
    if (response.status === 429) {
      fallbackMsg = validRetry
        ? `Bạn vừa thao tác quá nhiều lần liên tiếp. Vui lòng chờ ${validRetry} giây trước khi thử lại.`
        : 'Bạn vừa gửi yêu cầu quá nhiều lần liên tiếp. Vui lòng chờ 1 phút trước khi thử lại.';
    } else if (response.status === 502 || response.status === 503 || response.status === 504) {
      fallbackMsg = 'Máy chủ Hanzi4U tạm thời quá tải hoặc đang bảo trì. Vui lòng thử lại sau vài giây.';
    } else if (response.status >= 500) {
      fallbackMsg = 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.';
    }

    const errorMsg = data?.error?.message || data?.message || fallbackMsg;
    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).retryAfterSeconds =
      data?.error?.details?.remainingSeconds ?? validRetry;
    (error as any).data = data || {
      error: {
        code: response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : `HTTP_${response.status}`,
        message: errorMsg,
        details: validRetry ? { remainingSeconds: validRetry } : undefined,
      },
    };
    throw error;
  }

  return data?.data !== undefined ? data.data : data;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),
};
