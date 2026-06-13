/**
 * Low-level TMDB HTTP client.
 *
 * Centralizes all outbound requests so that auth, retry, caching, and error
 * shape are handled in exactly one place. Higher-level service modules
 * (`movies`, `discover`, `search`, ...) compose this client and only worry
 * about the endpoint path + query params they need.
 *
 * Auth strategy: TMDB v4 read-access token via `Authorization: Bearer ...`,
 * read from `TMDB_READ_ACCESS_TOKEN` (server-only — never exposed to the
 * browser bundle).
 *
 * Caching strategy: leverages Next.js `fetch` extensions (`next.revalidate`,
 * `next.tags`) so responses are served from the data cache at the edge and
 * can be revalidated on a per-endpoint TTL.
 *
 * Retry strategy: small exponential backoff for 429 (rate-limit) and 5xx
 * transient failures, bounded to keep request latency predictable.
 */

import { TMDB_BASE_URL } from "@/constants/tmdb";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 400;
const DEFAULT_REVALIDATE_SECONDS = 60 * 60; // 1 hour

function getAuthToken(): string {
  const token =
    process.env.TMDB_READ_ACCESS_TOKEN ??
    process.env.NEXT_PUBLIC_TMDB_READ_ACCESS_TOKEN ??
    "";
  if (!token && process.env.NODE_ENV !== "production") {
    // Warn in dev so a missing token is loud, but don't crash builds.
    // eslint-disable-next-line no-console
    console.warn(
      "[tmdb] TMDB_READ_ACCESS_TOKEN is not set — requests will fail.",
    );
  }
  return token;
}

// -----------------------------------------------------------------------------
// Error type
// -----------------------------------------------------------------------------

export class TmdbError extends Error {
  public readonly status: number;
  public readonly endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

// -----------------------------------------------------------------------------
// Request options
// -----------------------------------------------------------------------------

export interface TmdbRequestOptions {
  /** Query string params. `undefined` / `null` values are filtered out. */
  params?: Record<
    string,
    string | number | boolean | null | undefined
  >;
  /** Per-request override of the cache TTL, in seconds. */
  revalidate?: number;
  /** Cache tags (used by `revalidateTag` for on-demand purges). */
  tags?: string[];
  /** Opt out of caching entirely for live queries (e.g. instant search). */
  cache?: RequestCache;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function buildUrl(
  endpoint: string,
  params: TmdbRequestOptions["params"],
): string {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  // TMDB defaults to en-US, but we set it explicitly to keep cache keys stable
  // and to avoid surprises if a future env changes the default locale.
  if (!url.searchParams.has("language")) {
    url.searchParams.set("language", "en-US");
  }
  return url.toString();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Whether a failed response is worth retrying.
 *  - 429: TMDB rate-limit
 *  - 5xx: transient server-side issue
 */
function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

// -----------------------------------------------------------------------------
// Core request
// -----------------------------------------------------------------------------

/**
 * Issue a GET request to TMDB.
 *
 * Throws a `TmdbError` on a non-2xx response after retries are exhausted, so
 * callers can rely on the resolved value being well-formed JSON of type `T`.
 */
export async function tmdbGet<T>(
  endpoint: string,
  options: TmdbRequestOptions = {},
): Promise<T> {
  const url = buildUrl(endpoint, options.params);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchInit: RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  } = {
    method: "GET",
    headers,
  };

  if (options.cache) {
    fetchInit.cache = options.cache;
  } else {
    fetchInit.next = {
      revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
      ...(options.tags ? { tags: options.tags } : {}),
    };
  }

  let attempt = 0;
  // We retry only on transient errors; permanent ones (4xx other than 429)
  // throw immediately so the caller sees the real failure shape.
  while (true) {
    let response: Response;
    try {
      response = await fetch(url, fetchInit);
    } catch (err) {
      // Network failure — treat as retryable up to MAX_RETRIES.
      if (attempt >= MAX_RETRIES) {
        throw new TmdbError(
          `Network error reaching TMDB: ${(err as Error).message}`,
          0,
          endpoint,
        );
      }
      await delay(BASE_BACKOFF_MS * 2 ** attempt);
      attempt += 1;
      continue;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    if (isRetryable(response.status) && attempt < MAX_RETRIES) {
      // Honor Retry-After if TMDB provides it, otherwise back off exponentially.
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader
        ? Number.parseInt(retryAfterHeader, 10) * 1000
        : BASE_BACKOFF_MS * 2 ** attempt;
      await delay(Number.isFinite(retryAfterMs) ? retryAfterMs : BASE_BACKOFF_MS);
      attempt += 1;
      continue;
    }

    // Non-retryable or out of retries — surface a structured error.
    let message = `TMDB request failed (${response.status})`;
    try {
      const body = (await response.json()) as { status_message?: string };
      if (body?.status_message) message = body.status_message;
    } catch {
      // Body wasn't JSON; keep the default message.
    }
    throw new TmdbError(message, response.status, endpoint);
  }
}
