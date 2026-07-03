import type { ApiResponse } from '../types/api.types';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://automationexercise.com/api';

/**
 * Both the HTTP-level status and the parsed response body.
 * Use `httpStatus` to assert REST compliance (HTTP standard behaviour).
 * Use `body.responseCode` to assert the API's own outcome code (legacy pattern).
 */
export interface ApiResult<T extends ApiResponse = ApiResponse> {
  httpStatus: number;
  body: T;
}

/**
 * Typed API client using Node.js native fetch.
 *
 * Key design notes:
 * - Uses native fetch (Node.js 18+) — avoids Cloudflare TLS fingerprinting that
 *   blocks Playwright's APIRequestContext (which uses a non-browser TLS stack).
 * - All request bodies are sent as `application/x-www-form-urlencoded`,
 *   NOT JSON — this is what the automationexercise API expects.
 * - The API always returns HTTP 200. The actual outcome lives in `body.responseCode`.
 *   Callers must assert `body.responseCode`, not the HTTP status — unless they are
 *   specifically testing REST standard compliance via `*WithStatus` methods.
 * - Each test uses its own ApiClient instance for isolation (stateless, no cookies).
 */
export class ApiClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = (baseURL ?? BASE_URL).replace(/\/$/, '');
  }

  // ─── Internal fetch ────────────────────────────────────────────────────────

  private async _fetch<T extends ApiResponse = ApiResponse>(
    method: string,
    path: string,
    {
      params,
      form,
    }: { params?: Record<string, string>; form?: Record<string, string> } = {}
  ): Promise<ApiResult<T>> {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const hasBody = method !== 'GET' && method !== 'HEAD';

    const response = await fetch(`${this.baseURL}${path}${qs}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: hasBody && form ? new URLSearchParams(form).toString() : undefined,
    });

    const body = (await response.json()) as T;
    return { httpStatus: response.status, body };
  }

  // ─── Convenience methods (body only — for functional tests) ───────────────

  async get<T extends ApiResponse = ApiResponse>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    return (await this._fetch<T>('GET', path, { params })).body;
  }

  async post<T extends ApiResponse = ApiResponse>(
    path: string,
    form?: Record<string, string>
  ): Promise<T> {
    return (await this._fetch<T>('POST', path, { form })).body;
  }

  async put<T extends ApiResponse = ApiResponse>(
    path: string,
    form?: Record<string, string>
  ): Promise<T> {
    return (await this._fetch<T>('PUT', path, { form })).body;
  }

  async delete<T extends ApiResponse = ApiResponse>(
    path: string,
    form?: Record<string, string>
  ): Promise<T> {
    return (await this._fetch<T>('DELETE', path, { form })).body;
  }

  // ─── WithStatus methods (httpStatus + body — for REST compliance tests) ───

  async getWithStatus<T extends ApiResponse = ApiResponse>(
    path: string,
    params?: Record<string, string>
  ): Promise<ApiResult<T>> {
    return this._fetch<T>('GET', path, { params });
  }

  async postWithStatus<T extends ApiResponse = ApiResponse>(
    path: string,
    form?: Record<string, string>
  ): Promise<ApiResult<T>> {
    return this._fetch<T>('POST', path, { form });
  }

  async putWithStatus<T extends ApiResponse = ApiResponse>(
    path: string,
    form?: Record<string, string>
  ): Promise<ApiResult<T>> {
    return this._fetch<T>('PUT', path, { form });
  }

  async deleteWithStatus<T extends ApiResponse = ApiResponse>(
    path: string,
    form?: Record<string, string>
  ): Promise<ApiResult<T>> {
    return this._fetch<T>('DELETE', path, { form });
  }

  // ─── Timing helper (for performance baseline tests) ───────────────────────

  async getWithTiming<T extends ApiResponse = ApiResponse>(
    path: string,
    params?: Record<string, string>
  ): Promise<{ body: T; elapsedMs: number }> {
    const start = Date.now();
    const body = await this.get<T>(path, params);
    const elapsedMs = Date.now() - start;
    return { body, elapsedMs };
  }
}

