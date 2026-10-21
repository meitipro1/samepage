import Link from 'next/link';

import { DEPLOYMENT } from '@/lib/genlayer-core.mjs';
import { gen, left, short, shortHash } from '@/lib/format';
import { TERM_LABEL, TERMS, lapsed, lastChecked, pageLine, stepLabel, verdictLabel } from '@/lib/page';
import type { Page, PageItem, Round, Status, Term, Verdict } from '@/lib/types';

export const EXPLORER = DEPLOYMENT.explorer as string;
export const CONTRACT = DEPLOYMENT.samepage as string;

export function txUrl(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function addressUrl(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

export function Tx({ hash, label }: { hash: string; label?: string }) {
  if (!hash) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={txUrl(hash)} target="_blank" rel="noreferrer">
      {label ? `${label} ` : ''}
      {shortHash(hash)} ↗
    </a>
  );
}

export function Addr({ address, you = false }: { address: string; you?: boolean }) {
  if (!address) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={addressUrl(address)} target="_blank" rel="noreferrer" title={address}>
      {short(address)}
      {you ? ' (you)' : ''}
    </a>
  );
}

/** Teal for a match, hatched for a difference, grey for absent. */
export function StatusBadge({ status }: { status?: Status }) {
  if (!status) return <span className="c-badge pending">not checked</span>;
  return <span className={`c-badge ${status.toLowerCase()}`}>{status.toLowerCase()}</span>;
}

export function VerdictBadge({ verdict, count = 0, big = false }: { verdict: Verdict | ''; count?: number; big?: boolean }) {
  if (!verdict) return null;
  const cls = verdict === 'SAME_PAGE' ? 'match' : verdict === 'DIFFERENT' ? 'differ' : 'absent';
  return <span className={`c-badge ${cls} ${big ? 'big' : ''}`}>{verdictLabel(verdict, count)}</span>;
}

/** Where a page is now: its step, or how it closed. Dotted for a no-show. */
export function StepBadge({ p, now }: { p: Pick<Page, 'status' | 'step' | 'step_end'>; now?: number }) {
  const label = stepLabel(p, now);
  const cls =
    p.status === 'AGREED' ? 'match' : p.status === 'NO_SHOW' ? 'noshow' : p.status === 'NOT_AGREED' ? 'absent' : lapsed(p, now) ? 'noshow' : 'live';
  return <span className={`c-badge ${cls}`}>{label}</span>;
}

/**
 * The six terms, both sides' words as the leader's notes put them, and the
 * status. Differences first, as the result page shows them. The notes are a
 * reading aid; the record is both full texts and the statuses.
 */
export function TermTable({ r, compact = false }: { r: Round; compact?: boolean }) {
  const order = [...TERMS].sort((a, b) => rank(r.statuses[a]) - rank(r.statuses[b]));
  return (
    <div className="c-card overflow-x-auto">
      <table className="c-table c-terms">
        <thead>
          <tr>
            <th style={{ width: 130 }}>Term</th>
            {!compact && <th>What the leader read</th>}
            <th style={{ width: 110 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {order.map((t) => (
            <tr key={t} className={`c-term ${String(r.statuses[t] ?? '').toLowerCase()}`}>
              <td className="font-medium">{TERM_LABEL[t]}</td>
              {!compact && <td className="c-muted text-[14px]">{r.notes[t] ?? (r.statuses[t] === 'ABSENT' ? 'Neither account states it.' : '')}</td>}
              <td>
                <StatusBadge status={r.statuses[t]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function rank(s?: Status): number {
  return s === 'DIFFER' ? 0 : s === 'MATCH' ? 1 : 2;
}

/** A compact card for one page: title, sides, deposit, last verdict and the six statuses as a strip. */
export function PageCard({ p, rounds, now }: { p: Page; rounds: Round[]; now?: number }) {
  const r = lastChecked(rounds);
  return (
    <Link href={`/p/${p.id}`} className="c-card block p-5 transition-colors hover:border-[var(--line-strong)]">
      <div className="flex items-center gap-3">
        <p className="c-eyebrow min-w-0 flex-1 truncate">
          Page #{p.id} · {p.title}
        </p>
        <StepBadge p={p} now={now} />
      </div>
      <p className="c-faint mt-2 text-[13px]">
        {short(p.opener)} opened, {short(p.counterparty)} named · {gen(p.deposit)} deposit each · round {p.round} of 2
      </p>
      {r ? (
        <div className="mt-4 flex flex-col gap-1.5">
          {TERMS.map((t: Term) => (
            <div key={t} className={`c-term-line ${String(r.statuses[t] ?? '').toLowerCase()}`}>
              <span>{TERM_LABEL[t]}</span>
              <StatusBadge status={r.statuses[t]} />
            </div>
          ))}
          <div className="mt-3 flex items-center gap-3 border-t border-[var(--line)] pt-3">
            <span className="c-eyebrow">Round {r.number}</span>
            <span className="ml-auto">
              <VerdictBadge verdict={r.verdict} count={r.count} />
            </span>
          </div>
        </div>
      ) : (
        <p className="c-muted mt-4 text-[14px]">Not checked yet.</p>
      )}
    </Link>
  );
}

/** One page in a list: title, sides, step and its last verdict. */
export function PageRow({ p, now, you = '' }: { p: PageItem; now?: number; you?: string }) {
  const urgent = p.status === 'OPEN' && !lapsed(p, now);
  return (
    <Link href={`/p/${p.id}`} className="c-row-link grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="c-faint text-[12.5px]">
          #{p.id} · {short(p.opener)}
          {you && p.opener.toLowerCase() === you ? ' (you)' : ''} and {short(p.counterparty)}
          {you && p.counterparty.toLowerCase() === you ? ' (you)' : ''} · {gen(p.deposit)} each
        </p>
        <p className="mt-1 truncate text-[17px] font-medium">{p.title}</p>
        <p className="c-muted mt-0.5 text-[13.5px]">{pageLine(p, now)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[13px]">
        {urgent && <span className="c-faint">window {left(p.step_end, now)}</span>}
        {p.last_verdict && <VerdictBadge verdict={p.last_verdict} count={p.last_count} />}
        <StepBadge p={p} now={now} />
      </div>
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="c-note">{children}</div>;
}

export function ReadError({ message }: { message: string }) {
  return (
    <div className="c-card pad">
      <p className="font-medium">The chain did not answer.</p>
      <p className="c-muted mt-1 text-[14px]">{message}</p>
    </div>
  );
}
