# StreakHub

Daily streak tracking web app — solo use, free-tier friendly. Check in on the web; reminders and alerts via Telegram.

## Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Auth | Auth.js v5 (email/password) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Storage | Cloudflare R2 (avatar & photo proof, optional) |
| Cron | Vercel Cron |
| Icons | Lucide |

## Requirements

- Node.js 20+
- [Neon](https://neon.tech) account (Postgres)
- (Optional) Cloudflare R2 for image uploads
- (Optional) Telegram bot via [@BotFather](https://t.me/BotFather)

## Local setup

```bash
git clone <repo-url> streakhub
cd streakhub
npm install
cp .env.example .env
# Edit .env — see table below
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Next.js prefers `.env.local` over `.env`. You can copy `DATABASE_URL` and other vars into `.env.local`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `AUTH_SECRET` | Yes | Auth.js secret — `openssl rand -base64 32` |
| `AUTH_URL` | Dev | App URL, e.g. `http://localhost:3000` |
| `CRON_SECRET` | Prod | Protects cron endpoints — `openssl rand -base64 32` |
| `TELEGRAM_BOT_TOKEN` | Optional | Token from BotFather |
| `TELEGRAM_BOT_USERNAME` | Optional | Bot username (without `@`) |
| `TELEGRAM_WEBHOOK_SECRET` | Optional | Telegram webhook verification secret |
| `NEXT_PUBLIC_APP_URL` | Prod | Public URL, used in Telegram reminder links |
| `R2_ACCOUNT_ID` | Optional | Cloudflare R2 — avatar/photo upload |
| `R2_ACCESS_KEY_ID` | Optional | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Optional | R2 secret |
| `R2_BUCKET_NAME` | Optional | Bucket name |
| `R2_PUBLIC_URL` | Optional | Public bucket URL (e.g. `https://pub-xxx.r2.dev`) |

## Database

```bash
npm run db:generate   # Create migration after schema changes
npm run db:migrate    # Run migrations against Neon
npm run db:studio     # Drizzle Studio (GUI)
npm run db:push       # Push schema directly (fast dev; avoid on prod)
```

## Timezone & streak logic

Each streak has its own **IANA timezone** (e.g. `Asia/Ho_Chi_Minh`).

### Streak day

- A **day** = calendar day in the streak’s timezone (00:00–23:59 local).
- **1 check-in per day per streak** (unique `streak_id + check_in_date`).

### Check-in

- `none`: Done button
- `text`: note (configurable minimum length)
- `photo`: image upload (+ optional caption)
- `task`: complete a linked task → auto check-in

`initial_streak` only sets `current_streak` at creation — it does **not** backfill fake check-ins. You still need to check in today.

### Missed days & freeze

Cron `/api/cron/miss-days` runs **every hour**:

1. For each streak, process past days (through yesterday in the streak TZ) without a check-in.
2. **Freeze quota left** → use 1 freeze; streak is **not** reset.
3. **No freeze left** → `current_streak = 0`, archive `streak_run`, update `best_streak`.

**Freeze quota** resets at the start of each month in the streak timezone (`freeze_month_key` = `YYYY-MM`).

### Telegram reminders

Cron `/api/cron/telegram-reminders` runs **every 15 minutes**:

- Sends a reminder when within `reminder_time` (±15 min) and not checked in today.
- At most 1 reminder per streak per day (`last_reminder_sent_on`).

## Telegram bot

### 1. Create the bot

1. Chat [@BotFather](https://t.me/BotFather) → `/newbot`
2. Save the **token** → `TELEGRAM_BOT_TOKEN`
3. Save the **username** → `TELEGRAM_BOT_USERNAME`

### 2. Link your account

1. Deploy the app (HTTPS required for webhooks).
2. In the app: **Settings** → **Generate link** → open the Telegram link → **Start**.
3. The bot stores your `chat_id` and sends reminders and alerts there.

Proof / check-in is **web only**, not via the bot.

### 3. Webhook (after deploy)

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<your-domain>/api/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

Verify:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### 4. Test cron locally

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/miss-days
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/telegram-reminders
```

## Deploy (Vercel)

1. Import the repo into Vercel
2. Add environment variables (table above)
3. Cron is configured in `vercel.json` — requires a plan that supports Cron
4. Run migrations: `npm run db:migrate` (locally with prod `DATABASE_URL`, or via CI)
5. Set the Telegram webhook (section above)

After the first deploy, set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production URL.

## PWA

The app ships with `manifest.ts` and an icon — use **Add to Home Screen** on mobile. No offline cache in V1; a network connection is required to check in.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:*` | Drizzle migrations |

## Project structure (summary)

```
src/
  app/              # Routes (dashboard, streaks, tasks, settings, api)
  components/       # UI components
  lib/
    db/             # Drizzle schema & client
    streaks/        # Streak engine, timezone, constants
    telegram/       # Bot API, link, reminders
  server/actions/   # Server Actions
drizzle/            # SQL migrations
```

## V1 scope

- Solo user, email/password auth
- Streak wizard, check-in, freeze, tasks
- Telegram reminders + alerts (no check-in via bot)

**Not included:** WhatsApp, Google Calendar, native mobile apps, external sync APIs, AI verify.
