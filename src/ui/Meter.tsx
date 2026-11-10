// value: 0..1
export function Meter({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return <span className={className ? `bar ${className}` : 'bar'}><i style={{ width: `${v * 100}%` }} /></span>;
}
