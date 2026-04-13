"use client";

import { useEffect, useState } from "react";

interface SyncAccount {
  email: string;
  isConnected: boolean;
  mailbox: {
    syncStatus: string;
    lastSyncAt: string | null;
    lastError: string | null;
    totalMessages: number;
  } | null;
}

export function SyncStatusBanner() {
  const [accounts, setAccounts] = useState<SyncAccount[]>([]);
  const [syncing, setSyncing] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/sync/status");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function triggerSync() {
    setSyncing(true);
    try {
      await fetch("/api/sync/trigger", { method: "POST" });
      await fetchStatus();
    } finally {
      setSyncing(false);
    }
  }

  if (accounts.length === 0) return null;

  const isSyncing = accounts.some(
    (a) => a.mailbox?.syncStatus === "SYNCING"
  );
  const hasError = accounts.some(
    (a) => a.mailbox?.syncStatus === "ERROR"
  );

  const lastSync = accounts
    .map((a) => a.mailbox?.lastSyncAt)
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <div
      className={`px-4 py-2 text-sm flex items-center justify-between ${
        hasError
          ? "bg-red-50 text-red-700 border-b border-red-200"
          : isSyncing
          ? "bg-blue-50 text-blue-700 border-b border-blue-200"
          : "bg-green-50 text-green-700 border-b border-green-200"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSyncing && (
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              className="opacity-75"
            />
          </svg>
        )}
        <span>
          {isSyncing
            ? "Syncing..."
            : hasError
            ? "Sync error"
            : lastSync
            ? `Last synced ${new Date(lastSync).toLocaleTimeString()}`
            : "Not synced yet"}
        </span>
        {hasError && (
          <span className="text-xs">
            {accounts.find((a) => a.mailbox?.syncStatus === "ERROR")?.mailbox
              ?.lastError}
          </span>
        )}
      </div>
      <button
        onClick={triggerSync}
        disabled={syncing || isSyncing}
        className="text-xs px-3 py-1 rounded bg-white border shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  );
}
