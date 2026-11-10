import type { ButtonHTMLAttributes } from 'react';

export function Button({ tone, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'red' }) {
  return <button {...p} className={['btn', tone, className].filter(Boolean).join(' ')} />;
}
