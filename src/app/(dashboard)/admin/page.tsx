"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HealthData {
  totalAccounts: number;
  connectedAccounts: number;
  disconnectedAccounts: number;
  totalMessages: number;
  totalThreads: number;
  activeSyncs: number;
  errorMailboxes: number;
  recentFailedJobs: number;
}

interface AccountData {
  id: string;
  email: string;
  displayName: string | null;
  isConnected: boolean;
  connectedAt: string;
  user: { email: string; name: string | null };
  mailbox: {
    syncStatus: string;
    lastSyncAt: string | null;
    lastError: string | null;
    totalMessages: number;
    syncJobs: { status: string; createdAt: string }[];
    _count: { messages: number; threads: number };
  } | null;
}

function StatCard({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, accountsRes] = await Promise.all([
          fetch("/api/admin/health"),
          fetch("/api/admin/accounts"),
        ]);

        if (healthRes.ok) setHealth(await healthRes.json());
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          setAccounts(data.accounts);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleResync(accountId: string) {
    setActionLoading(accountId);
    try {
      await fetch(`/api/admin/accounts/${accountId}/resync`, {
        method: "POST",
      });
      // Refresh accounts
      const res = await fetch("/api/admin/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisconnect(accountId: string) {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    setActionLoading(accountId);
    try {
      await fetch(`/api/admin/accounts/${accountId}/disconnect`, {
        method: "POST",
      });
      const res = await fetch("/api/admin/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          System health and connected accounts overview
        </p>
      </div>

      {/* Health Overview */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Connected Accounts"
            value={health.connectedAccounts}
            color="green"
          />
          <StatCard
            label="Total Messages"
            value={health.totalMessages.toLocaleString()}
            color="blue"
          />
          <StatCard
            label="Active Syncs"
            value={health.activeSyncs}
            color="yellow"
          />
          <StatCard
            label="Recent Errors (24h)"
            value={health.recentFailedJobs}
            color={health.recentFailedJobs > 0 ? "red" : "green"}
          />
        </div>
      )}

      {/* Quick Links */}
      <div className="flex gap-3 mb-6">
        <Link
          href="/admin/emails"
          className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
        >
          View All Emails
        </Link>
        <Link
          href="/admin/sync-jobs"
          className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
        >
          Sync Job Logs
        </Link>
        <Link
          href="/admin/audit-logs"
          className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
        >
          Audit Logs
        </Link>
      </div>

      {/* Connected Accounts Table */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-50">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Gmail</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Messages</th>
                <th className="px-6 py-3">Last Sync</th>
                <th className="px-6 py-3">Last Error</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {account.user.name || account.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {account.user.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {account.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        !account.isConnected
                          ? "bg-gray-100 text-gray-600"
                          : account.mailbox?.syncStatus === "SYNCING"
                          ? "bg-blue-100 text-blue-700"
                          : account.mailbox?.syncStatus === "ERROR"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {!account.isConnected
                        ? "Disconnected"
                        : account.mailbox?.syncStatus || "No mailbox"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {account.mailbox?._count.messages.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {account.mailbox?.lastSyncAt
                      ? new Date(
                          account.mailbox.lastSyncAt
                        ).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4">
                    {account.mailbox?.lastError ? (
                      <span
                        className="text-xs text-red-600 max-w-[200px] truncate block"
                        title={account.mailbox.lastError}
                      >
                        {account.mailbox.lastError}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {account.isConnected && (
                        <button
                          onClick={() => handleResync(account.id)}
                          disabled={actionLoading === account.id}
                          className="px-3 py-1 text-xs rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          {actionLoading === account.id
                            ? "..."
                            : "Re-sync"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        disabled={
                          actionLoading === account.id || !account.isConnected
                        }
                        className="px-3 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No connected accounts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
