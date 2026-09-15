import { getBrowserClient } from "@/lib/supabase/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
}

interface ApiEnvelope<T> {
  data: T;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let token: string | null = null;

  try {
    const { data } = await getBrowserClient().auth.getSession();
    token = data.session?.access_token ?? null;
  } catch {
    token = null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers ?? {}) },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code: string | null = null;
    try {
      const body = (await response.json()) as ApiErrorEnvelope;
      if (body?.error?.message) {
        message = body.error.message;
      }
      code = body?.error?.code ?? null;
    } catch {
      // fall through to default message
    }
    throw new ApiError(message, response.status, code);
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_URL };