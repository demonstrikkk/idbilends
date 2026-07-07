import { z } from "zod";
import { API_BASE_URL } from "@/lib/constants";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  searchParams?: Record<string, string | number | undefined | null>;
};

export async function apiFetch<T>(path: string, schema: z.ZodType<T>, options: ApiOptions = {}): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(`API request failed for ${path}`, response.status, payload);
  }

  return schema.parse(payload);
}
