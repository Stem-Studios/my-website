'use client';
import type { ReactNode } from 'react';
import katex from 'katex';
import { ArrowUpRight, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
export function MathText({ value, display = true }: { value: string; display?: boolean }) {
  return (
    <span
      className={display ? 'math-display' : ''}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(value, {
          throwOnError: false,
          displayMode: display,
          trust: false,
        }),
      }}
    />
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function PanelHeading({
  title,
  subtitle,
  href,
  label = 'View all',
}: {
  title: string;
  subtitle?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link" aria-label={label || `View ${title}`}>
          {label}
          <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  );
}
export function Badge({
  children,
  tone = 'purple',
}: {
  children: ReactNode;
  tone?: 'purple' | 'green' | 'muted' | 'amber';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Empty({
  title,
  description,
  href,
  label = 'Start practicing',
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <Sparkles size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="button button-secondary" href={href}>
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Meter({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  return (
    <div className="meter">
      <div style={{ width: `${value}%`, background: color }} />
    </div>
  );
}
