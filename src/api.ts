import { config } from './config.js';

const BASE_URL = 'https://api.track.toggl.com/api/v9';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Toggl API ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${btoa(`${token}:api_token`)}`,
  };
}

async function requestWithConfig<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, {
    ...options,
    headers: {
      ...authHeaders(config.apiToken),
      ...options.headers,
    },
  });
}

export function get<T>(path: string): Promise<T> {
  return requestWithConfig<T>(path);
}

export async function getWithToken<T>(path: string, token: string): Promise<T> {
  return request<T>(path, { headers: authHeaders(token) });
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return requestWithConfig<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function del<T>(path: string): Promise<T> {
  return requestWithConfig<T>(path, { method: 'DELETE' });
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return requestWithConfig<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}
