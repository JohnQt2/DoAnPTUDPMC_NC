// In-memory token storage to prevent XSS theft from localStorage
let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null;
}

const API_BASE = '/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
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

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (inMemoryAccessToken) {
    reqHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: reqHeaders,
    credentials: 'include', // Ensure cookies (refresh token) are sent
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized, attempt Silent Token Refresh
  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/otp/verify')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.data?.accessToken;
          setAccessToken(newToken);
          refreshSubscribers.forEach((callback) => callback(newToken));
          refreshSubscribers = [];
        } else {
          clearAccessToken();
          window.dispatchEvent(new Event('auth:unauthorized'));
          throw new Error('Phiên đăng nhập đã hết hạn.');
        }
      } catch (err) {
        clearAccessToken();
        window.dispatchEvent(new Event('auth:unauthorized'));
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for existing refresh to complete
      await new Promise<void>((resolve) => {
        refreshSubscribers.push((token) => {
          reqHeaders['Authorization'] = `Bearer ${token}`;
          resolve();
        });
      });
    }

    // Retry original request with new token
    if (inMemoryAccessToken) {
      reqHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`;
    }
    response = await fetch(url, { ...config, headers: reqHeaders });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `Lỗi yêu cầu (${response.status})`;
    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).data = data;
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
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
