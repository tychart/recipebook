import type { SemanticSearchResult } from "../../types/types";
import { authFetch } from "./client";

const API_BASE = "/api/generate";
const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 25;

export interface SemanticSearchRequest {
  query: string;
  limit?: number;
}

function clampLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.trunc(limit)));
}

export async function searchRecipes(body: SemanticSearchRequest): Promise<SemanticSearchResult[]> {
  const response = await authFetch(`${API_BASE}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: body.query,
      limit: clampLimit(body.limit),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to search recipes");
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as SemanticSearchResult[]) : [];
}
