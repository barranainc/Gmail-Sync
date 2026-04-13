"use client";

import Link from "next/link";

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLabelBadges(labelIds: string[]): string[] {
  const visible = ["IMPORTANT", "CATEGORY_UPDATES", "CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_FORUMS"];
  return labelIds.filter((l) => visible.includes(l)).map((l) => l.replace("CATEGORY_", ""));
}

export function EmailListItem({ email }: { email: Email }) {
  const senderDisplay = email.fromName || email.fromEmail || "Unknown";
  const labels = getLabelBadges(email.labelIds);
  const threadLink = email.threadId
    ? `/inbox/${email.threadId}`
    : `/inbox/${email.id}`;

  return (
    <Link href={threadLink} className="block">
      <div
        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
          !email.isRead ? "bg-blue-50/50" : ""
        }`}
      >
        {/* Unread indicator */}
        <div className="flex-shrink-0 mt-2">
          {!email.isRead && (
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          )}
          {email.isRead && <div className="w-2 h-2" />}
        </div>

        {/* Star */}
        <div className="flex-shrink-0 mt-1">
          {email.isStarred ? (
            <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm truncate ${
                !email.isRead ? "font-semibold text-gray-900" : "text-gray-700"
              }`}
            >
              {senderDisplay}
            </span>
            {email.attachments.length > 0 && (
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6h-1.5v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6H16.5z" />
              </svg>
            )}
            <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">
              {formatDate(email.internalDate)}
            </span>
          </div>
          <div
            className={`text-sm truncate ${
              !email.isRead ? "font-medium text-gray-900" : "text-gray-600"
            }`}
          >
            {email.subject || "(no subject)"}
          </div>
          <div className="text-xs text-gray-400 truncate mt-0.5">
            {email.snippet}
          </div>
          {labels.length > 0 && (
            <div className="flex gap-1 mt-1">
              {labels.map((label) => (
                <span
                  key={label}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
