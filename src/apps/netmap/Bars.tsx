// misja.html linia 1025: 24 słupki aktywności, bieżąca godzina jako .now
export function Bars({ akt, now, className }: { akt: number[]; now: number; className: 'spark' | 'chart' }) {
  return (
    <span className={className}>
      {akt.map((v, h) => <i key={h} className={h === now ? 'now' : undefined} style={{ height: `${(v / 3) * 100}%` }} />)}
    </span>
  );
}
