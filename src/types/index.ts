import { UserRole } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

export interface ParsedEmail {
  gmailMessageId: string;
  gmailThreadId: string;
  subject: string | null;
  snippet: string | null;
  fromEmail: string | null;
  fromName: string | null;
  toEmails: string | null;
  ccEmails: string | null;
  bccEmails: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  internalDate: Date;
  labelIds: string[];
  isRead: boolean;
  isStarred: boolean;
  sizeEstimate: number | null;
  headers: Record<string, string>;
  attachments: {
    gmailAttachmentId: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
  participants: {
    email: string;
    name: string | null;
    type: "FROM" | "TO" | "CC" | "BCC";
  }[];
}

export interface SyncResult {
  messagesProcessed: number;
  threadsProcessed: number;
  errors: string[];
  newHistoryId: string | null;
}
