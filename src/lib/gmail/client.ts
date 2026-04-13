import { google, gmail_v1 } from "googleapis";
import { prisma } from "../prisma";
import { decrypt, encrypt } from "../encryption";

export async function getGmailClient(
  googleAccountId: string
): Promise<gmail_v1.Gmail> {
  const googleAccount = await prisma.googleAccount.findUnique({
    where: { id: googleAccountId },
  });

  if (!googleAccount) {
    throw new Error(`Google account not found: ${googleAccountId}`);
  }

  if (!googleAccount.isConnected) {
    throw new Error(`Google account is disconnected: ${googleAccountId}`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  const accessToken = decrypt(googleAccount.accessToken);
  const refreshToken = googleAccount.refreshToken
    ? decrypt(googleAccount.refreshToken)
    : null;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: googleAccount.tokenExpiry?.getTime(),
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    const updateData: Record<string, unknown> = {};

    if (tokens.access_token) {
      updateData.accessToken = encrypt(tokens.access_token);
    }
    if (tokens.refresh_token) {
      updateData.refreshToken = encrypt(tokens.refresh_token);
    }
    if (tokens.expiry_date) {
      updateData.tokenExpiry = new Date(tokens.expiry_date);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.googleAccount.update({
        where: { id: googleAccountId },
        data: updateData,
      });
    }
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;

      const statusCode = (error as { code?: number }).code;

      // Don't retry client errors (except rate limits)
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        throw error;
      }

      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
      }
    }
  }

  throw lastError;
}
