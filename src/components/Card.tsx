import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line ${className}`}>{children}</div>;
}
