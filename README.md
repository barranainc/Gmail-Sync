# Gmail Sync - Internal Email Platform

Internal email sync and automation platform. Employees connect their Google accounts via OAuth, and their Gmail inboxes are synced into our system in near real-time.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **PostgreSQL** with Prisma ORM
- **Google OAuth 2.0** via NextAuth.js
- **Gmail API** for email sync
- **AES-256-GCM** encryption for token storage

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud project with OAuth credentials and Gmail API enabled

## Setup

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or select existing)
3. Enable the **Gmail API**
4. Go to **APIs & Services > Credentials**
5. Create **OAuth 2.0 Client ID** (Web application)
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for session encryption
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `ENCRYPTION_KEY` - 64 hex characters for AES-256 token encryption

Generate a secure encryption key:
```bash
openssl rand -hex 32
```

Generate a NextAuth secret:
```bash
openssl rand -base64 32
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

Open http://localhost:3000 and click "Connect with Google".

### 4. Make First User Admin

After your first login, promote yourself to admin:

```bash
npx prisma db execute --stdin <<< "UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';"
```

## Architecture

### Email Sync Flow

1. Employee clicks "Connect Google" and completes OAuth
2. App stores encrypted OAuth tokens
3. Initial sync pulls recent 500 emails
4. Polling runs every 60s using Gmail History API for incremental updates
5. Emails are normalized into threads/messages/participants/attachments

### Sync Strategy

- **Initial sync**: `messages.list` + `messages.get` for last 500 messages
- **Incremental sync**: `history.list` for changes since last historyId
- **Fallback**: If historyId expires, falls back to initial sync
- **Retry**: Exponential backoff with jitter (3 retries)
- **Deduplication**: Unique constraints on gmailMessageId per mailbox

### Triggering Sync

- **Manual**: Click "Sync Now" in the UI or POST `/api/sync/trigger`
- **External cron**: GET `/api/cron/sync` (set `CRON_SECRET` for auth)
- **Admin**: Re-sync individual accounts from admin panel

## API Routes

### User APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/emails` | List emails (paginated, searchable) |
| GET | `/api/emails/[id]` | Get single email |
| GET | `/api/threads/[threadId]` | Get thread with messages |
| GET | `/api/labels` | Get labels |
| POST | `/api/sync/trigger` | Trigger manual sync |
| GET | `/api/sync/status` | Get sync status |

### Admin APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/accounts` | List all connected accounts |
| GET | `/api/admin/accounts/[id]` | Account detail |
| POST | `/api/admin/accounts/[id]/resync` | Force re-sync |
| POST | `/api/admin/accounts/[id]/disconnect` | Disconnect account |
| GET | `/api/admin/sync-jobs` | Sync job history |
| GET | `/api/admin/audit-logs` | Audit logs |
| GET | `/api/admin/health` | System health |
| GET | `/api/admin/emails` | View all synced emails |

## Database Schema

Key tables: `users`, `google_accounts`, `mailboxes`, `threads`, `messages`, `participants`, `labels`, `attachments`, `sync_jobs`, `audit_logs`, `automation_events`

View full schema: `prisma/schema.prisma`

## Security

- OAuth tokens encrypted at rest with AES-256-GCM
- CSRF protection via NextAuth
- Role-based access control (admin/user)
- Auth proxy protects all routes
- Input validation on API endpoints
