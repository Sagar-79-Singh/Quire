import type { ReactNode } from 'react';
export function RibbonGroup({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`ribbon-group ${className}`} aria-label={title} data-ribbon-group={title}>
    <div className="ribbon-group-content">{children}</div><div className="ribbon-group-label">{title}</div>
  </section>;
}
