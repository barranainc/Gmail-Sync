"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface AccountStatus {
  email: string;
  isConnected: boolean;
  mailbox: {
    syncStatus: string;
    lastSyncAt: string | null;
    lastError: string | null;
    totalMessages: number;
  } | null;
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<AccountStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/sync/status");
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Connected Accounts */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Connected Google Account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your connected Gmail account
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No Google account connected
              </p>
              <button
                onClick={() => (window.location.href = "/login")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Connect Google Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {account.email}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`inline-flex items-center text-xs ${
                          account.isConnected
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1 ${
                            account.isConnected
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        {account.isConnected ? "Connected" : "Disconnected"}
                      </span>
                      {account.mailbox && (
                        <>
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs text-gray-500">
                            {account.mailbox.totalMessages.toLocaleString()}{" "}
                            messages synced
                          </span>
                          {account.mailbox.lastSyncAt && (
                            <>
                              <span className="text-xs text-gray-400">|</span>
                              <span className="text-xs text-gray-500">
                                Last sync:{" "}
                                {new Date(
                                  account.mailbox.lastSyncAt
                                ).toLocaleString()}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Session</h2>
        </div>
        <div className="p-6">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
