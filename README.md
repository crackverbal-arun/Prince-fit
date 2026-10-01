# Prince Fit

Mobile-first app for a personal trainer to manage clients across **workouts, diet, attendance, progress and payments**. Two roles:

- **Prince (trainer):** dashboard of who's in today, who needs a nudge (absent 3+ days, light diet log, package ending, dues), one-tap WhatsApp reminders, and per-client workout plan, meal plan, attendance calendar, progress and packages.
- **Clients:** check in, log today's workout (with PR detection), tick meals and add plate photos, log weight/measurements/progress photos, and see their package and attendance.

Stack: Next.js 16 (App Router, Server Actions), Tailwind v4, Drizzle ORM + libSQL (SQLite locally, Turso in production), JWT cookie sessions.

## Run locally

```bash
npm install
cp .env.example .env.local      # set SESSION_SECRET, TRAINER_PHONE, TRAINER_PASSWORD
npm run db:push                 # create tables
npm run seed                    # create Prince's login  (or: npm run seed:demo for 4 sample clients, password demo123)
npm run dev
```

## Deploy (Vercel + Turso, both have free tiers)

1. `turso db create prince-fit` → copy the URL and `turso db tokens create prince-fit`.
2. Set `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `SESSION_SECRET`, `TRAINER_*` in Vercel and in `.env.local`.
3. Run `npm run db:push && npm run seed` once against Turso, then deploy.
4. Clients add the site to their home screen (works like an app).

## Notes

- WhatsApp nudges open WhatsApp with a pre-written message (wa.me links). No API cost. Automatic sending would need the WhatsApp Business API (e.g. Interakt, AiSensy).
- Photos are compressed on the phone (~100KB) and stored in the DB. Move them to object storage if the number of clients grows past a few hundred.
- Dates are in IST.
