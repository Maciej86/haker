import type { ReactNode } from 'react';

export function Card({ title, children, className }: { title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={className ? `card ${className}` : 'card'}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}
