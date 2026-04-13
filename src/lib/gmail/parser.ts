import { gmail_v1 } from "googleapis";
import { ParsedEmail } from "@/types";

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value ?? null;
}

function parseEmailAddress(raw: string | null): {
  email: string;
  name: string | null;
} {
  if (!raw) return { email: "", name: null };

  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim() };
  }
  return { email: raw.trim(), name: null };
}

function parseEmailAddressList(
  raw: string | null
): { email: string; name: string | null }[] {
  if (!raw) return [];
  return raw.split(",").map((addr) => parseEmailAddress(addr.trim()));
}

function decodeBody(data: string | undefined | null): string {
  if (!data) return "";
  return Buffer.from(data, "base64url").toString("utf-8");
}

function extractBody(
  payload: gmail_v1.Schema$MessagePart | undefined
): { text: string | null; html: string | null } {
  if (!payload) return { text: null, html: null };

  let text: string | null = null;
  let html: string | null = null;

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    text = decodeBody(payload.body.data);
  } else if (payload.mimeType === "text/html" && payload.body?.data) {
    html = decodeBody(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data && !text) {
        text = decodeBody(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data && !html) {
        html = decodeBody(part.body.data);
      } else if (
        part.mimeType?.startsWith("multipart/") &&
        part.parts
      ) {
        const nested = extractBody(part);
        if (nested.text && !text) text = nested.text;
        if (nested.html && !html) html = nested.html;
      }
    }
  }

  return { text, html };
}

function extractAttachments(
  payload: gmail_v1.Schema$MessagePart | undefined
): ParsedEmail["attachments"] {
  const attachments: ParsedEmail["attachments"] = [];
  if (!payload) return attachments;

  function walk(part: gmail_v1.Schema$MessagePart) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      attachments.push({
        gmailAttachmentId: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      part.parts.forEach(walk);
    }
  }

  walk(payload);
  return attachments;
}

export function parseGmailMessage(
  message: gmail_v1.Schema$Message
): ParsedEmail {
  const headers = message.payload?.headers;
  const { text, html } = extractBody(message.payload);
  const attachments = extractAttachments(message.payload);

  const from = parseEmailAddress(getHeader(headers, "From"));
  const toList = parseEmailAddressList(getHeader(headers, "To"));
  const ccList = parseEmailAddressList(getHeader(headers, "Cc"));
  const bccList = parseEmailAddressList(getHeader(headers, "Bcc"));

  const participants: ParsedEmail["participants"] = [];
  if (from.email) {
    participants.push({ ...from, type: "FROM" });
  }
  toList.forEach((p) => participants.push({ ...p, type: "TO" }));
  ccList.forEach((p) => participants.push({ ...p, type: "CC" }));
  bccList.forEach((p) => participants.push({ ...p, type: "BCC" }));

  const labelIds = message.labelIds || [];

  const headersMap: Record<string, string> = {};
  if (headers) {
    for (const h of headers) {
      if (h.name && h.value) {
        headersMap[h.name] = h.value;
      }
    }
  }

  return {
    gmailMessageId: message.id!,
    gmailThreadId: message.threadId!,
    subject: getHeader(headers, "Subject"),
    snippet: message.snippet || null,
    fromEmail: from.email || null,
    fromName: from.name,
    toEmails: toList.map((p) => p.email).join(", ") || null,
    ccEmails: ccList.map((p) => p.email).join(", ") || null,
    bccEmails: bccList.map((p) => p.email).join(", ") || null,
    bodyText: text,
    bodyHtml: html,
    internalDate: new Date(parseInt(message.internalDate || "0")),
    labelIds,
    isRead: !labelIds.includes("UNREAD"),
    isStarred: labelIds.includes("STARRED"),
    sizeEstimate: message.sizeEstimate || null,
    headers: headersMap,
    attachments,
    participants,
  };
}
