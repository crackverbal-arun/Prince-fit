import Link from "next/link";
import { getBodyStats } from "@/lib/queries";
import { getPhotos, getProfile } from "@/lib/q-client";
import { MEASURES, type MeasureKey } from "@/lib/body";
import { bmiReport, bmiTone } from "@/lib/bmi";
import { fmtDate, todayISO } from "@/lib/dates";
import { LineChart } from "./line-chart";
import { BodyForm } from "./body-form";
import { BodyEntry } from "./body-entry";
import { PhotoDelete, PhotoUploader } from "./photo-uploader";
import { Chip, Empty } from "./ui";

/** Weight + measurement history, before/after comparison and progress photos for one client. */
export async function BodyView({ clientId, metric, href, bmiHref }: { clientId: string; metric?: string; href: (p: { metric?: string; pose?: string }) => string; bmiHref: string }) {
  const [stats, photos, profile] = await Promise.all([getBodyStats(clientId), getPhotos(clientId), getProfile(clientId)]);
  const today = todayISO();
  const available = MEASURES.filter(([k]) => stats.some((s) => s[k as MeasureKey] != null));
  const m = available.find(([k]) => k === metric) ?? available[0];
  const series = m ? stats.filter((s) => s[m[0]] != null).map((s) => ({ date: s.date, value: s[m[0]] as number })) : [];
  const firstOf = (k: MeasureKey) => stats.find((s) => s[k] != null);
  const lastOf = (k: MeasureKey) => stats.findLast((s) => s[k] != null);
  const bmi = profile.weightKg && profile.heightCm && profile.age && profile.sex ? bmiReport({ sex: profile.sex, age: profile.age, heightCm: profile.heightCm, weightKg: profile.weightKg }) : null;

  const poses = ["front", "side", "back", "other"].filter((p) => photos.some((x) => x.pose === p));
  const before = (p: string) => photos.find((x) => x.pose === p), after = (p: string) => photos.findLast((x) => x.pose === p);

  return (
    <div className="space-y-3">
      <BodyForm clientId={clientId} today={today} />

      {bmi ? (
        <Link href={bmiHref} className="card flex items-center justify-between">
          <div><div className="text-xs text-muted">BMI (from {profile.weightKg} kg, {profile.heightCm} cm)</div><div className="text-2xl font-bold">{bmi.bmi}</div></div>
          <div className="text-right"><Chip tone={bmiTone(bmi.asian)}>{bmi.asian} (Asian)</Chip><div className="mt-1 text-[11px] text-muted">WHO: {bmi.who} · open calculator ›</div></div>
        </Link>
      ) : <Link href={bmiHref} className="card block text-sm text-muted">BMI calculator ›<span className="block text-[11px]">Height, age and sex come from the assessment; add them there to see BMI here.</span></Link>}

      {!stats.length ? <Empty>No measurements yet.</Empty> : (
        <>
          <div className="card">
            <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {available.map(([k, l]) => <Link key={k} href={href({ metric: k })} replace scroll={false} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${m?.[0] === k ? "bg-ink text-white ring-ink" : "bg-bg text-muted ring-line"}`}>{l}</Link>)}
            </div>
            {series.length >= 2 ? <LineChart points={series} unit={m![2] === "kg" ? " kg" : m![2] === "%" ? "%" : " cm"} goodWhen={m![5] ?? undefined} />
              : <p className="py-4 text-center text-sm text-muted">Log {m?.[1].toLowerCase()} at least twice to see the trend.</p>}
          </div>

          <div className="card p-0">
            <div className="grid grid-cols-[1fr_auto_auto_3.5rem] gap-x-3 border-b border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted"><span>Before → after</span><span>Start</span><span>Now</span><span className="text-right">Change</span></div>
            {available.map(([k, l, unit, , , better]) => {
              const a = firstOf(k)!, b = lastOf(k)!, d = +((b[k] as number) - (a[k] as number)).toFixed(1);
              const tone = !better || d === 0 ? "text-muted" : (d > 0) === (better === "up") ? "text-good" : "text-bad";
              return (
                <div key={k} className="grid grid-cols-[1fr_auto_auto_3.5rem] items-baseline gap-x-3 px-4 py-1.5 text-sm">
                  <span>{l} <span className="text-[11px] text-muted">{unit}</span></span>
                  <span className="text-right text-muted">{a[k]}<span className="block text-[10px]">{fmtDate(a.date)}</span></span>
                  <span className="text-right font-semibold">{b[k]}<span className="block text-[10px] font-normal text-muted">{fmtDate(b.date)}</span></span>
                  <span className={`text-right text-xs font-semibold ${tone}`}>{d > 0 ? "+" : ""}{d}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 className="h-section">Progress photos</h2>
      <PhotoUploader clientId={clientId} today={today} />
      {poses.map((p) => {
        const b = before(p)!, a = after(p)!;
        return b.id !== a.id ? (
          <div key={p} className="card">
            <div className="mb-2 text-sm font-semibold capitalize">{p}: before &amp; after</div>
            <div className="grid grid-cols-2 gap-2">
              {[b, a].map((x, i) => (
                <figure key={x.id} className="overflow-hidden rounded-xl ring-1 ring-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.photo} alt={`${p} ${i ? "after" : "before"}, ${x.date}`} className="aspect-[3/4] w-full object-cover" />
                  <figcaption className="bg-surface py-1 text-center text-[11px] text-muted">{i ? "After" : "Before"} · {fmtDate(x.date)}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null;
      })}
      {photos.length ? (
        <div className="grid grid-cols-3 gap-2">
          {[...photos].reverse().map((p) => (
            <figure key={p.id} className="relative overflow-hidden rounded-xl ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt={`${p.pose} ${p.date}`} className="aspect-[3/4] w-full object-cover" />
              <PhotoDelete clientId={clientId} id={p.id} legacy={p.legacy} />
              <figcaption className="bg-surface py-1 text-center text-[10px] capitalize text-muted">{p.pose} · {fmtDate(p.date)}</figcaption>
            </figure>
          ))}
        </div>
      ) : <Empty>No photos yet. A front, side and back photo every 4 weeks is plenty.</Empty>}

      {stats.length > 0 && (
        <>
          <h2 className="h-section">All entries</h2>
          <div className="card divide-y divide-line p-0">
            {[...stats].reverse().map((s) => <BodyEntry key={s.id} clientId={clientId} today={today} dateLabel={fmtDate(s.date)} entry={{ ...s, createdAt: null, photo: null } as unknown as Record<string, string | number | null> & { id: string }} />)}
          </div>
        </>
      )}
    </div>
  );
}
