import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getJob, listJobs, retryJob } from "../api/jobs";
import { useAuth } from "../context/AuthContext";
import type { JobDetail, JobSource, JobStatus, JobSummary } from "../../types/types";

const POLL_INTERVAL_MS = 3000;

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return "Not yet";
  }
  return new Date(value).toLocaleString();
}

function statusClasses(status: JobStatus): string {
  if (status === "succeeded") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "failed") return "bg-red-100 text-red-800 border-red-200";
  if (status === "running") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function sourceLabel(source: JobSource): string {
  return source === "ocr" ? "Image import" : "Text import";
}

export default function Jobs() {
  const { user, isInitializing } = useAuth();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  async function refreshJobs() {
    const nextJobs = await listJobs();
    setJobs(nextJobs);
    setSelectedJobId((current) => current ?? nextJobs[0]?.job_id ?? null);
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const nextJobs = await listJobs();
        if (!active) return;
        setJobs(nextJobs);
        setSelectedJobId((current) => current ?? nextJobs[0]?.job_id ?? null);
        setError(null);
      } catch {
        if (!active) return;
        setError("Failed to load jobs.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void refreshJobs().catch(() => {
        if (active) {
          setError("Failed to refresh jobs.");
        }
      });
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedJobId || !user) {
      setSelectedJob(null);
      return;
    }

    let active = true;
    setDetailLoading(true);
    setActionError(null);

    getJob(selectedJobId)
      .then((job) => {
        if (active) {
          setSelectedJob(job);
        }
      })
      .catch(() => {
        if (active) {
          setActionError("Failed to load job details.");
        }
      })
      .finally(() => {
        if (active) {
          setDetailLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedJobId, user]);

  const selectedSummary = useMemo(
    () => jobs.find((job) => job.job_id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const selectedStatus = selectedJob?.status ?? selectedSummary?.status ?? null;

  async function handleRetry(jobId: string) {
    setRetryingJobId(jobId);
    setActionError(null);
    try {
      const retried = await retryJob(jobId);
      await refreshJobs();
      setSelectedJobId(retried.job_id);
    } catch {
      setActionError("Failed to retry that job.");
    } finally {
      setRetryingJobId(null);
    }
  }

  if (isInitializing) return <p>Loading jobs...</p>;
  if (!user) return <p>Please log in to view your jobs.</p>;
  if (loading) return <p>Loading jobs...</p>;

  return (
    <div className="py-6">
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Queue
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-stone-900">Jobs</h1>
            <p className="mt-2 text-sm text-stone-500">
              OCR and text imports run here in the background.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
              No jobs yet. Start an import from the new recipe page.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.job_id}
                  type="button"
                  onClick={() => setSelectedJobId(job.job_id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    selectedJobId === job.job_id
                      ? "border-red-300 bg-red-50 shadow-sm"
                      : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{sourceLabel(job.source)}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Created {formatTimestamp(job.created_at)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.error ? (
                    <p className="mt-3 text-sm text-red-700 line-clamp-2">{job.error}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,247,237,0.96))] p-6 shadow-sm">
          {!selectedSummary ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 px-6 py-12 text-center text-stone-500">
              Select a job to see its details.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                    Job detail
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-stone-900">
                    {sourceLabel(selectedSummary.source)}
                  </h2>
                  <p className="mt-2 text-sm text-stone-500">
                    Job ID: <span className="font-mono text-xs">{selectedSummary.job_id}</span>
                  </p>
                </div>
                {selectedStatus ? (
                  <span className={`rounded-full border px-4 py-2 text-sm font-medium ${statusClasses(selectedStatus)}`}>
                    {selectedStatus}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Created</p>
                  <p className="mt-2 text-sm font-medium text-stone-800">{formatTimestamp(selectedSummary.created_at)}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Started</p>
                  <p className="mt-2 text-sm font-medium text-stone-800">{formatTimestamp(selectedSummary.started_at)}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Completed</p>
                  <p className="mt-2 text-sm font-medium text-stone-800">{formatTimestamp(selectedSummary.completed_at)}</p>
                </div>
              </div>

              {actionError ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              ) : null}

              {detailLoading ? (
                <p className="mt-6 text-sm text-stone-500">Loading job details...</p>
              ) : null}

              {selectedJob?.error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                  <p className="text-sm font-semibold text-red-800">Failure</p>
                  <p className="mt-2 text-sm text-red-700">{selectedJob.error}</p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedSummary.status === "failed" ? (
                  <button
                    type="button"
                    onClick={() => void handleRetry(selectedSummary.job_id)}
                    disabled={retryingJobId === selectedSummary.job_id}
                    className="inline-flex w-auto items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    {retryingJobId === selectedSummary.job_id ? "Retrying..." : "Retry Job"}
                  </button>
                ) : null}

                {selectedSummary.status === "succeeded" ? (
                  <Link
                    to={`/recipe/new?job=${selectedSummary.job_id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    Open Draft
                  </Link>
                ) : null}
              </div>

              {selectedJob ? (
                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                  <div className="rounded-2xl border border-stone-200 bg-white px-5 py-5">
                    <h3 className="text-lg font-semibold text-stone-900">Logs</h3>
                    {selectedJob.logs.length === 0 ? (
                      <p className="mt-3 text-sm text-stone-500">No logs yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {selectedJob.logs.map((log, index) => (
                          <p key={`${selectedJob.job_id}-${index}`} className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
                            {log}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white px-5 py-5">
                    <h3 className="text-lg font-semibold text-stone-900">Result</h3>
                    {selectedJob.result ? (
                      <div className="mt-3 space-y-3 text-sm text-stone-600">
                        <p>
                          Draft name: <span className="font-medium text-stone-900">{selectedJob.result.draft.name || "Untitled"}</span>
                        </p>
                        <p>
                          Ingredients: <span className="font-medium text-stone-900">{selectedJob.result.draft.ingredients.length}</span>
                        </p>
                        <p>
                          Instructions: <span className="font-medium text-stone-900">{selectedJob.result.draft.instructions.length}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-stone-500">
                        The full parsed result becomes available here when the job succeeds.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
