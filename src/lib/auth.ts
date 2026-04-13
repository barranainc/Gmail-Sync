import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { encrypt } from "./encryption";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && account.access_token) {
        try {
          const encryptedAccessToken = encrypt(account.access_token);
          const encryptedRefreshToken = account.refresh_token
            ? encrypt(account.refresh_token)
            : null;

          // Find or create user
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
              },
            });
          }

          // Upsert Google account
          const existingGoogleAccount = await prisma.googleAccount.findUnique({
            where: { googleId: account.providerAccountId },
          });

          if (existingGoogleAccount) {
            await prisma.googleAccount.update({
              where: { googleId: account.providerAccountId },
              data: {
                accessToken: encryptedAccessToken,
                refreshToken:
                  encryptedRefreshToken ?? existingGoogleAccount.refreshToken,
                tokenExpiry: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
                scopes: account.scope ?? null,
                isConnected: true,
                disconnectedAt: null,
              },
            });
          } else {
            await prisma.googleAccount.create({
              data: {
                userId: dbUser.id,
                googleId: account.providerAccountId,
                email: user.email!,
                displayName: user.name,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiry: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
                scopes: account.scope ?? null,
              },
            });
          }

          // Ensure mailbox exists
          const googleAccount = await prisma.googleAccount.findUnique({
            where: { googleId: account.providerAccountId },
          });

          if (googleAccount) {
            await prisma.mailbox.upsert({
              where: { googleAccountId: googleAccount.id },
              create: {
                googleAccountId: googleAccount.id,
                email: user.email!,
              },
              update: {},
            });
          }
        } catch (error) {
          console.error("Error storing Google account:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      if (account) {
        token.googleAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as Record<string, unknown>).id = token.userId;
        (session.user as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
