import type { Amount } from './types';
export function euro(value: Amount, signed = false): string {
  if (value === 'UNKNOWN') return 'Unknown';
  if (value === 'N/A') return 'N/A';
  const text = new Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(Math.abs(value));
  return value < 0 ? `(${text})` : signed && value > 0 ? `+${text}` : text;
}
export const num = (v: number) => new Intl.NumberFormat('en-IE').format(v);
