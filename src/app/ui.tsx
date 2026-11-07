import type { ReactNode } from 'react';
import { fmt } from '../lib/fmt';
import { addDays } from './db';

export { fmt };

export function Card(props: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card glass ${props.className ?? ''}`} aria-label={props.title}>
      <header>
        <h2>{props.title}</h2>
        {props.action}
      </header>
      {props.children}
    </section>
  );
}

/** Progress towards a daily target; past it, the bar turns amber rather than overflowing. */
export function Bar(props: { label: string; value: number; target: number; unit: string }) {
  const pct = props.target > 0 ? props.value / props.target : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">
        <span>{props.label}</span>
        <span className="num">
          {fmt(props.value)} / {fmt(props.target)} {props.unit}
        </span>
      </div>
      <div className="bar-track" role="progressbar" aria-label={props.label} aria-valuemin={0} aria-valuemax={Math.round(props.target)} aria-valuenow={Math.round(props.value)}>
        <div className={pct > 1.1 ? 'over' : undefined} style={{ width: `${Math.min(pct, 1) * 100}%` }} />
      </div>
    </div>
  );
}

export function DateNav(props: { date: string; onChange: (d: string) => void; max: string }) {
  const label = new Date(`${props.date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="datenav">
      <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => props.onChange(addDays(props.date, -1))}>
        ‹
      </button>
      <h1>{props.date === props.max ? 'Today' : label}</h1>
      <button type="button" className="icon-btn" aria-label="Next day" disabled={props.date >= props.max} onClick={() => props.onChange(addDays(props.date, 1))}>
        ›
      </button>
    </div>
  );
}

