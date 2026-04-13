"use client";

import { useEffect, useState, useCallback } from "react";
import { EmailListItem } from "./email-list-item";

interface Email {
  id: string;
  gmailMessageId: string;
  gmailThreadId: string;
  subject: string | null;
  snippet: string | null;
  fromEmail: string | null;
  fromName: string | null;
  internalDate: string;
  isRead: boolean;
  isStarred: boolean;
  labelIds: string[];
  attachments: { id: string; filename: string }[];
  threadId: string | null;
}

interface EmailListProps {
  searchQuery?: string;
  label?: string;
}

export function EmailList({ searchQuery, label }: EmailListProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (searchQuery) params.set("search", searchQuery);
      if (label) params.set("label", label);

      const res = await fetch(`/api/emails?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, label]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, label]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading emails...</div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
        <p className="text-lg font-medium">No emails found</p>
        {searchQuery && (
          <p className="text-sm mt-1">Try a different search query</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
        {total} emails {searchQuery && `matching "${searchQuery}"`}
      </div>
      <div className="divide-y divide-gray-100">
        {emails.map((email) => (
          <EmailListItem key={email.id} email={email} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
