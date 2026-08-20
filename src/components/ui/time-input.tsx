const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function TimeInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [h, m] = value.split(":");
  const hour = HOURS.includes(h) ? h : "08";
  const minute = MINUTES.includes(m) ? m : "00";

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5">
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        aria-label="Heure"
        className="bg-transparent text-sm focus:outline-none"
      >
        {HOURS.map((h2) => (
          <option key={h2} value={h2}>
            {h2}
          </option>
        ))}
      </select>
      <span className="text-navy-400">h</span>
      <select
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        aria-label="Minutes"
        className="bg-transparent text-sm focus:outline-none"
      >
        {MINUTES.map((m2) => (
          <option key={m2} value={m2}>
            {m2}
          </option>
        ))}
      </select>
      <input type="hidden" name={name} value={`${hour}:${minute}`} />
    </div>
  );
}
