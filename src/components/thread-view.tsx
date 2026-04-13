"use client";

import { useEffect, useState } from "react";
import { MessageCard } from "./message-card";

interface Participant {
  id: string;
  email: string;
  name: string | null;
  type: string;
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface Message {
  id: string;
  subject: string | null;
  fromEmail: string | null;
  fromName: string | null;
  toEmails: string | null;
  ccEmails: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  internalDate: string;
  isRead: boolean;
  labelIds: string[];
  participants: Participant[];
  attachments: Attachment[];
}

interface Thread {
  id: string;
  gmailThreadId: string;
  snippet: string | null;
  messageCount: number;
  messages: Message[];
}

export function ThreadView({ threadId }: { threadId: string }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchThread() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/threads/${threadId}`);
        if (res.ok) {
          const data = await res.json();
          setThread(data);
        } else {
          setError("Failed to load thread");
        }
      } catch {
        setError("Failed to load thread");
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading thread...</div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error || "Thread not found"}</div>
      </div>
    );
  }

  const subject =
    thread.messages[0]?.subject || thread.snippet || "(no subject)";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="px-6 py-4 border-b">
        <h1 className="text-xl font-semibold text-gray-900">{subject}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {thread.messageCount} message{thread.messageCount !== 1 ? "s" : ""} in
          this thread
        </p>
      </div>

      <div className="divide-y">
        {thread.messages.map((message, index) => (
          <MessageCard
            key={message.id}
            message={message}
            defaultExpanded={index === thread.messages.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
