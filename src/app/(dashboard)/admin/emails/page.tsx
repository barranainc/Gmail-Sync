"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedAccount {
  id: string;
  email: string;
  displayName: string | null;
  isConnected: boolean;
  mailbox: {
    id: string;
    syncStatus: string;
    lastSyncAt: string | null;
    _count: { messages: number; threads: number };
  } | null;
}

interface EmailSummary {
  id: string;
  subject: string | null;
  snippet: string | null;
  fromEmail: string | null;
  fromName: string | null;
  toEmails: string | null;
  internalDate: string;
  isRead: boolean;
  isStarred: boolean;
  labelIds: string[];
  attachments: { id: string }[];
}

interface EmailDetail {
  id: string;
  subject: string | null;
  fromEmail: string | null;
  fromName: string | null;
  toEmails: string | null;
  internalDate: string;
  bodyText: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  participants: {
    id: string;
    email: string;
    name: string | null;
    type: string;
  }[];
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
  mailbox: {
    email: string;
    googleAccount: { email: string; displayName: string | null };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusDot(status: string) {
  const colors: Record<string, string> = {
    idle: "bg-green-400",
    syncing: "bg-blue-400 animate-pulse",
    error: "bg-red-400",
  };
  return colors[status] ?? "bg-gray-400";
}

// ─── Account List Panel ───────────────────────────────────────────────────────

function AccountPanel({
  accounts,
  selectedId,
  onSelect,
  loading,
}: {
  accounts: ConnectedAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="w-72 border-r bg-gray-50 flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-white">
        <h2 className="text-sm font-semibold text-gray-700">Connected Accounts</h2>
        <p className="text-xs text-gray-400 mt-0.5">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-400">Loading accounts…</div>
        ) : accounts.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">No connected accounts</div>
        ) : (
          accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => onSelect(account.id)}
              className={`w-full text-left px-4 py-3 border-b transition-colors ${
                selectedId === account.id
                  ? "bg-blue-50 border-l-2 border-l-blue-500"
                  : "hover:bg-gray-100 border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    account.isConnected ? statusDot(account.mailbox?.syncStatus ?? "idle") : "bg-gray-300"
                  }`}
                />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {account.displayName || account.email}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate pl-4">{account.email}</p>
              {account.mailbox && (
                <p className="text-xs text-gray-400 mt-1 pl-4">
                  {account.mailbox._count.messages.toLocaleString()} messages
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Email List Panel ─────────────────────────────────────────────────────────

function EmailListPanel({
  emails,
  selectedId,
  onSelect,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  search,
  onSearch,
  accountEmail,
}: {
  emails: EmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
  search: string;
  onSearch: (q: string) => void;
  accountEmail: string;
}) {
  return (
    <div className="w-96 border-r flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-gray-500 truncate mb-2">{accountEmail}</p>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search emails…"
          className="w-full text-sm px-3 py-1.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-gray-400 mt-1.5">{total.toLocaleString()} emails</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : emails.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No emails found</div>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={`w-full text-left px-4 py-3 border-b transition-colors ${
                selectedId === email.id
                  ? "bg-blue-50 border-l-2 border-l-blue-500"
                  : "hover:bg-gray-50 border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {!email.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      !email.isRead ? "font-semibold text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {email.fromName || email.fromEmail || "Unknown"}
                  </span>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {formatDate(email.internalDate)}
                </span>
              </div>
              <p className={`text-sm mt-0.5 truncate ${!email.isRead ? "font-medium" : "text-gray-600"}`}>
                {email.subject || "(no subject)"}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{email.snippet}</p>
              {email.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6h-1.5v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6H16.5z" />
                  </svg>
                  {email.attachments.length}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Email Detail Panel ───────────────────────────────────────────────────────

function EmailDetailPanel({
  email,
  loading,
  onDelete,
}: {
  email: EmailDetail | null;
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  const [showHtml, setShowHtml] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setShowHtml(false);
  }, [email?.id]);

  async function handleDelete() {
    if (!email) return;
    if (!confirm("Move this email to Trash? This will also trash it in the team member's Gmail.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/emails/${email.id}`, { method: "DELETE" });
      if (res.ok) onDelete(email.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <svg className="w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
        <p className="text-sm">Select an email to read</p>
      </div>
    );
  }

  const fromParticipant = email.participants.find((p) => p.type === "FROM");
  const toParticipants = email.participants.filter((p) => p.type === "TO");
  const ccParticipants = email.participants.filter((p) => p.type === "CC");

  const displayFrom = fromParticipant
    ? `${fromParticipant.name ? fromParticipant.name + " " : ""}<${fromParticipant.email}>`
    : email.fromEmail || "Unknown";

  const displayTo = toParticipants.length
    ? toParticipants.map((p) => (p.name ? `${p.name} <${p.email}>` : p.email)).join(", ")
    : email.toEmails || "";

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-xl font-semibold text-gray-900 leading-snug">
            {email.subject || "(no subject)"}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(email.internalDate).toLocaleString()}
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Move to Trash"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-400 w-6 flex-shrink-0">From</span>
            <span className="text-gray-700 font-medium">{displayFrom}</span>
          </div>
          {displayTo && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-6 flex-shrink-0">To</span>
              <span className="text-gray-600">{displayTo}</span>
            </div>
          )}
          {ccParticipants.length > 0 && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-6 flex-shrink-0">Cc</span>
              <span className="text-gray-600">
                {ccParticipants.map((p) => (p.name ? `${p.name} <${p.email}>` : p.email)).join(", ")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {email.mailbox.googleAccount.email}
          </span>
          {email.attachments.length > 0 && (
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6h-1.5v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6H16.5z" />
              </svg>
              {email.attachments.length} attachment{email.attachments.length !== 1 ? "s" : ""}
            </span>
          )}
          {(email.bodyHtml) && (
            <button
              onClick={() => setShowHtml((v) => !v)}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              {showHtml ? "Plain text" : "HTML view"}
            </button>
          )}
        </div>
      </div>

      {/* Attachments */}
      {email.attachments.length > 0 && (
        <div className="px-6 py-3 border-b bg-orange-50">
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-2"
              >
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6h-1.5v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6H16.5z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-gray-700 max-w-[160px] truncate">
                    {att.filename}
                  </p>
                  <p className="text-xs text-gray-400">{formatBytes(att.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {showHtml && email.bodyHtml ? (
          <iframe
            srcDoc={email.bodyHtml}
            className="w-full h-full border-0 rounded"
            sandbox="allow-same-origin"
            title="Email HTML"
          />
        ) : email.bodyText ? (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {email.bodyText}
          </pre>
        ) : email.bodyHtml ? (
          <iframe
            srcDoc={email.bodyHtml}
            className="w-full h-full border-0 rounded"
            sandbox="allow-same-origin"
            title="Email HTML"
          />
        ) : (
          <p className="text-sm text-gray-400 italic">No message body available.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminEmailBrowserPage() {
  // Accounts
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Email list
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // Email detail
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load accounts
  useEffect(() => {
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data.accounts ?? []);
        // Auto-select the first connected account
        const first = (data.accounts ?? []).find(
          (a: ConnectedAccount) => a.isConnected && a.mailbox
        );
        if (first) setSelectedAccountId(first.id);
      })
      .catch(console.error)
      .finally(() => setAccountsLoading(false));
  }, []);

  // Load emails when account / page / search changes
  const fetchEmails = useCallback(async () => {
    if (!selectedAccountId) return;
    setEmailsLoading(true);
    setSelectedMessageId(null);
    setEmailDetail(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        accountId: selectedAccountId,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/emails?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEmailsLoading(false);
    }
  }, [selectedAccountId, page, search]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Reset page & search when account changes
  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setPage(1);
    setSearch("");
    setSelectedMessageId(null);
    setEmailDetail(null);
  };

  // Load email detail
  const handleSelectMessage = async (id: string) => {
    setSelectedMessageId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/${id}`);
      if (res.ok) {
        setEmailDetail(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="flex h-full">
      {/* Pane 1: Account list */}
      <AccountPanel
        accounts={accounts}
        selectedId={selectedAccountId}
        onSelect={handleSelectAccount}
        loading={accountsLoading}
      />

      {/* Pane 2: Email list */}
      {selectedAccountId ? (
        <EmailListPanel
          emails={emails}
          selectedId={selectedMessageId}
          onSelect={handleSelectMessage}
          loading={emailsLoading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={(p) => setPage(p)}
          search={search}
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          accountEmail={selectedAccount?.email ?? ""}
        />
      ) : (
        <div className="w-96 border-r flex items-center justify-center text-sm text-gray-400 bg-white">
          Select an account to view emails
        </div>
      )}

      {/* Pane 3: Email detail */}
      <EmailDetailPanel
        email={emailDetail}
        loading={detailLoading}
        onDelete={(id) => {
          setEmails((prev) => prev.filter((e) => e.id !== id));
          setEmailDetail(null);
          setSelectedMessageId(null);
          setTotal((t) => t - 1);
        }}
      />
    </div>
  );
}
