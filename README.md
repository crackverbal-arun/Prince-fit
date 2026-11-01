# Prince Fit

Mobile-first client management for a personal trainer. Everything is tied to each client's profile:

- **Schedule**: one-off sessions, group classes (several clients, same slot) and weekly repeats; day/week view; tomorrow's list on the dashboard; reschedule/cancel with client notification; done / no-show feeds attendance.
- **Workout tracking**: set-by-set logging (reps × kg), timed holds, cardio (duration, distance, calories, heart rate); progressive-overload status, plateau detection, estimated 1-rep max, volume and pace charts; full month-by-month history. Prince and clients can both log.
- **Nutrition**: food log from an editable food database (or manual entry), calories, protein/carbs/fat, 11 vitamins & minerals against ICMR-NIN 2020 RDAs, water tracker, day/week/month history. Targets are calculated from the latest assessment (Mifflin-St Jeor) and can be overridden.
- **Body**: weight and 8 measurements, trend charts, before/after table, front/side/back progress photos, BMI.
- **Assessments**: baseline + 3-monthly reviews; the tests are customisable per client or for everyone (edit, replace, remove, add); results summary vs baseline/previous; health warnings.
- **BMI calculator**: male/female, age, ft/in or cm; WHO and Asian-Indian categories, healthy weight range, body-fat estimate, BMR.
- **Packages & payments**, attendance with absence reasons, WhatsApp nudges, and edit/delete on every record.

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

1. Create a Turso database and a token for it.
2. Import this repo in Vercel and add these environment variables:
   - `DATABASE_URL`: the `libsql://…turso.io` URL
   - `DATABASE_AUTH_TOKEN`: the Turso token
   - `SESSION_SECRET`: any long random string (32+ characters)
   - `SETUP_KEY`: any phrase you choose; you'll type it once on the setup page
3. Deploy, then open `https://<your-app>/setup`. It creates the tables and Prince's login, then switches itself off.
4. Clients add the site to their home screen (works like an app).

Schema changes: edit `src/db/schema.ts`, then run `npm run db:generate` (writes `drizzle/*.sql` and `src/db/migrations.ts`). Deployed databases upgrade themselves on the next server start (`src/instrumentation.ts`), so there's nothing to run against Turso.

## WhatsApp reminders

Works in two modes:

1. **One-tap (default, free).** Reminders, reschedules and cancellations show a green WhatsApp button with the message typed out. Prince taps and sends; the app records it.
2. **Automatic.** Set `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` (Meta WhatsApp Business Cloud API) and `CRON_SECRET` in Vercel. Then:
   - Every evening at 7 PM IST (`vercel.json` cron) reminders go out for the next day's sessions. Sessions already reminded are skipped; failed ones fall back to the green button.
   - Reschedule/cancel notices are sent instantly. If sending fails, the green button appears instead.

Meta only allows business-started messages using **pre-approved templates**. Create these two (category: Utility, language: English) in WhatsApp Manager:

| Template name | Body |
|---|---|
| `session_reminder` | `Hi {{1}}! Reminder: your training session with Prince is {{2}} at {{3}}. See you there!` |
| `session_update` | `Hi {{1}}, an update about your training session: {{2}}` |

Any external cron can also call `GET /api/cron/reminders?key=<CRON_SECRET>` (add `&day=today` for same-day reminders).

## Notes

- WhatsApp nudges open WhatsApp with a pre-written message (wa.me links). No API cost. Automatic sending would need the WhatsApp Business API (e.g. Interakt, AiSensy).
- Photos are compressed on the phone (~100KB) and stored in the DB. Move them to object storage if the number of clients grows past a few hundred.
- Dates are in IST.
- Exercises are tracked by weight × reps or by time (plank, cardio). For timed work, longer counts as better.
- Assessments: a baseline, then a review every 90 days (flagged on the dashboard). The form's fields are defined in `src/lib/assessment.ts`; add or change fields there. They're stored as JSON, so no database change is needed. Reports compare against the baseline and raise warnings for high resting HR, blood pressure, peak HR or pain of 6/10 and above.
- Attendance per day is present, absent (with a reason) or not marked. Clients can mark themselves absent; logging a workout overrides it.
