import type { JobDetail, JobSummary } from "../../types/types";
import { authFetch } from "./client";

const API_BASE = "/api/generate";

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || fallbackMessage);
  }
  return response.json() as Promise<T>;
}

export async function enqueueTextJob(text: string): Promise<JobSummary> {
  const response = await authFetch(`${API_BASE}/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  return parseJsonResponse<JobSummary>(response, "Failed to queue text import");
}

export async function enqueueOcrJob(image: File): Promise<JobSummary> {
  const formData = new FormData();
  formData.append("image", image);

  const response = await authFetch(`${API_BASE}/ocr`, {
    method: "POST",
    body: formData,
  });
  return parseJsonResponse<JobSummary>(response, "Failed to queue OCR import");
}

export async function listJobs(): Promise<JobSummary[]> {
  const response = await authFetch(`${API_BASE}/jobs`);
  return parseJsonResponse<JobSummary[]>(response, "Failed to load jobs");
}

export async function getJob(jobId: string): Promise<JobDetail> {
  const response = await authFetch(`${API_BASE}/jobs/${jobId}`);
  return parseJsonResponse<JobDetail>(response, "Failed to load job");
}

export async function retryJob(jobId: string): Promise<JobSummary> {
  const response = await authFetch(`${API_BASE}/jobs/${jobId}/retry`, {
    method: "POST",
  });
  return parseJsonResponse<JobSummary>(response, "Failed to retry job");
}
