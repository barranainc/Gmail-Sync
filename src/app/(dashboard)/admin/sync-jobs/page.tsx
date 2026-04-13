"use client";

import { useEffect, useState, useCallback } from "react";

interface SyncJob {
  id: string;
  type: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  messagesProcessed: number;
  error: string | null;
  createdAt: string;
  mailbox: {
    email: string;
    googleAccount: { displayName: string | null };
  };
}

export default function SyncJobsPage() {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/sync-jobs?page=${page}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function getStatusColor(status: string) {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "RUNNING":
        return "bg-blue-100 text-blue-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getDuration(
    startedAt: string | null,
    completedAt: string | null
  ): string {
    if (!startedAt) return "-";
    const start = new Date(startedAt).getTime();
    const end = completedAt
      ? new Date(completedAt).getTime()
      : Date.now();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sync Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">
          History of all email sync operations
        </p>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-50">
                <th className="px-6 py-3">Account</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Messages</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Started</th>
                <th className="px-6 py-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {job.mailbox.email}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {job.type}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {job.messagesProcessed}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {getDuration(job.startedAt, job.completedAt)}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      {job.error ? (
                        <span
                          className="text-xs text-red-600 truncate block max-w-[200px]"
                          title={job.error}
                        >
                          {job.error}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
