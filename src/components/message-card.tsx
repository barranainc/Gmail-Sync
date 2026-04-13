"use client";

import { useState } from "react";

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
  attachments: Attachment[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageCard({
  message,
  defaultExpanded = false,
}: {
  message: Message;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const senderDisplay = message.fromName || message.fromEmail || "Unknown";

  return (
    <div className="px-6 py-4">
      {/* Header - always visible */}
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {senderDisplay.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">
              {senderDisplay}
            </span>
            <span className="text-xs text-gray-400">
              &lt;{message.fromEmail}&gt;
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {formatDateTime(message.internalDate)}
            </span>
          </div>

          <div className="text-xs text-gray-500 mt-0.5">
            To: {message.toEmails || "unknown"}
            {message.ccEmails && (
              <span className="ml-2">Cc: {message.ccEmails}</span>
            )}
          </div>

          {!expanded && (
            <div className="text-sm text-gray-500 truncate mt-1">
              {message.bodyText?.substring(0, 200) || message.subject}
            </div>
          )}
        </div>

        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <svg
            className={`w-5 h-5 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
      </div>

      {/* Body - expandable */}
      {expanded && (
        <div className="mt-4 ml-13">
          {message.bodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 overflow-auto"
              dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
            />
          ) : message.bodyText ? (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
              {message.bodyText}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">No message body</p>
          )}

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {message.attachments.length} Attachment
                {message.attachments.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50 text-sm"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6h-1.5v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6H16.5z" />
                    </svg>
                    <span className="text-gray-700 truncate max-w-[200px]">
                      {att.filename}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatSize(att.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
