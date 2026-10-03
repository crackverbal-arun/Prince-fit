import { cmToFtIn, fmtValue, type AssessmentData, type Field } from "@/lib/assessment";
import { clockDuration } from "@/lib/dates";

const chip = "block rounded-lg bg-bg px-2.5 py-2 text-center text-xs font-semibold text-muted ring-1 ring-line peer-checked:bg-ink peer-checked:text-volt peer-checked:ring-ink";

// One input per field type. CSS-only (peer-checked chips), so it works as a plain server-rendered form.
export function AssessmentField({ f, value, previous }: { f: Field; value?: AssessmentData[string]; previous?: AssessmentData[string] }) {
  const hint = previous !== undefined && previous !== "" && <span className="ml-1 font-normal text-muted/80">· last {fmtValue(f, previous)}</span>;
  const label = <span className="label">{f.label}{hint}</span>;

  switch (f.type) {
    case "scale":
    case "choice": {
      const opts = f.type === "scale" ? Array.from({ length: f.max - f.min + 1 }, (_, i) => String(f.min + i)) : f.options;
      return (
        <fieldset>
          <legend className="contents">{label}</legend>
          <div className={f.type === "scale" ? "grid grid-cols-11 gap-1" : "flex flex-wrap gap-1.5"}>
            {opts.map((o) => (
              <label key={o} className="cursor-pointer">
                <input type="radio" name={f.key} value={o} defaultChecked={String(value ?? "") === o} className="peer sr-only" />
                <span className={`${chip} ${f.type === "scale" ? "px-0" : ""}`}>{o}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    case "multi":
      return (
        <fieldset>
          <legend className="contents">{label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {f.options.map((o) => (
              <label key={o} className="cursor-pointer">
                <input type="checkbox" name={f.key} value={o} defaultChecked={Array.isArray(value) && value.includes(o)} className="peer sr-only" />
                <span className={chip}>{o}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "height": {
      const h = typeof value === "number" ? cmToFtIn(value) : null;
      return (
        <div>
          {label}
          <div className="grid grid-cols-2 gap-2">
            <input name="heightFt" type="number" inputMode="numeric" min="3" max="8" placeholder="ft" defaultValue={h?.ft} className="input" aria-label="Height feet" />
            <input name="heightIn" type="number" inputMode="numeric" min="0" max="11" placeholder="in" defaultValue={h?.in} className="input" aria-label="Height inches" />
          </div>
        </div>
      );
    }
    case "textarea":
      return <label className="block">{label}<textarea name={f.key} rows={2} defaultValue={String(value ?? "")} placeholder={f.placeholder} className="input h-auto py-2" /></label>;
    case "duration":
      return <label className="block">{label}<input name={f.key} defaultValue={typeof value === "number" ? clockDuration(value) : ""} placeholder="m:ss, e.g. 1:18" className="input" /></label>;
    case "number":
      return (
        <label className="block">{label}
          <div className="relative">
            <input name={f.key} type="number" inputMode="decimal" step={f.step ?? 1} min="0" defaultValue={value as number | undefined} className="input pr-14" />
            {f.unit && <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-muted">{f.unit}</span>}
          </div>
        </label>
      );
    default:
      return <label className="block">{label}<input name={f.key} defaultValue={String(value ?? "")} placeholder={f.placeholder} className="input" /></label>;
  }
}
