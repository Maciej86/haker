const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c]);
}

export function fmt(n: number): string {
  return n.toLocaleString('pl-PL');
}

export function fmtSkill(v: number): string {
  return (+v.toFixed(2)).toLocaleString('pl-PL');
}

export function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{([^{}]+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}
