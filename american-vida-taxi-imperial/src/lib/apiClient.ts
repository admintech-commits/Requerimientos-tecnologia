/**
 * Cliente HTTP mínimo. Punto único para headers, token
 * y manejo de errores de red de toda la aplicación.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

async function request<TResponse>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<TResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No hay conexión con el servidor. ¿Está corriendo el API?', 0);
  }

  const data = (await response.json().catch(() => null)) as
    | (TResponse & { message?: string })
    | null;

  if (!response.ok) {
    throw new ApiError(data?.message ?? 'Error de comunicación con el servidor', response.status);
  }

  return data as TResponse;
}

async function uploadFile(path: string, file: File): Promise<{ url: string; name: string }> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const form = new FormData();
  form.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: form });
  } catch {
    throw new ApiError('No hay conexión con el servidor. ¿Está corriendo el API?', 0);
  }

  const data = (await response.json().catch(() => null)) as
    | { url: string; name: string; message?: string }
    | null;

  if (!response.ok || !data) {
    throw new ApiError(data?.message ?? 'No fue posible subir el archivo', response.status);
  }
  return data;
}

/** Convierte rutas relativas del API (/api/uploads/…) en URL absolutas */
export function resolveApiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const origin = BASE_URL.replace(/\/api$/, '');
  return `${origin}${path}`;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  upload: uploadFile,
};
