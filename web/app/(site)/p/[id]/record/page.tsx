import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CopyLink } from '@/components/CopyLink';
import { Addr, ReadError, StatusBadge, VerdictBadge } from '@/components/ui';
import { CONTRACT, EXPLORER } from '@/lib/genlayer-core.mjs';
import { dayTime, gen } from '@/lib/format';
import { TERMS, TERM_LABEL, lastChecked } from '@/lib/page';
import { getPage, readError } from '@/lib/read';
import type { PageFull, Round } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Record #${id}`, description: `The agreed record of page ${id}: both accounts, the six statuses and both signatures.` };
}

export default async function Record({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  let p: PageFull | undefined;
  let error = '';
  try {
    const got = await getPage(id);
    if (!got.found) notFound();
    p = got;
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith('NEXT_')) throw e;
    error = readError(e);
  }
  if (!p) return <div className="c-wrap py-12"><ReadError message={error} /></div>;
  const r = lastChecked(p.rounds) as Round | undefined;
  const agreed = p.status === 'AGREED' && r?.verdict === 'SAME_PAGE';

  return (
    <div className="c-wrap max-w-[920px] py-12">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Link href={`/p/${p.id}`} className="c-link text-[14px]">
          ← Page #{p.id}
        </Link>
        <span className="ml-auto" />
        <CopyLink />
      </div>
      <p className="c-eyebrow mt-8">Record #{p.id} · Samepage · GenLayer Studio Next</p>
      <h1 className="c-h2 mt-3">{p.title}</h1>
      {!agreed ? (
        <div className="c-note mt-6">
          This page is not an agreed record{p.status === 'OPEN' ? ' yet' : ''}: it is {p.status.replace('_', ' ').toLowerCase()}. An agreed record needs a
          same-page check and both signatures. <Link className="c-link" href={`/p/${p.id}`}>See the page</Link>.
        </div>
      ) : (
        <>
          <p className="c-muted mt-3 text-[14.5px]">
            Both sides wrote this deal separately, sealed, opened, and were checked on the same page in round {r.number}. Both
            signed. {gen(p.deposit)} deposits came back to each.
          </p>
          <div className="c-card mt-8 overflow-x-auto">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {TERMS.map((t) => (
                  <tr key={t} className={`c-term ${String(r.statuses[t] ?? '').toLowerCase()}`}>
                    <td className="font-medium">{TERM_LABEL[t]}</td>
                    <td>
                      <StatusBadge status={r.statuses[t]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="c-faint text-[13px]">Verdict, computed from the six statuses</span>
            <VerdictBadge verdict={r.verdict} count={r.count} />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {(['opener', 'counterparty'] as const).map((s) => (
              <div key={s} className="c-card pad">
                <p className="c-eyebrow">{s === 'opener' ? 'Opened by' : 'Counterparty'}</p>
                <p className="mt-1">
                  <Addr address={s === 'opener' ? p.opener : p.counterparty} />
                </p>
                <p className="c-account mt-4">{s === 'opener' ? r.opener_text : r.counterparty_text}</p>
                <p className="c-faint mt-4 text-[12.5px]">
                  Sealed {dayTime(s === 'opener' ? r.opener_sealed_at : r.counterparty_sealed_at)} · opened{' '}
                  {dayTime(s === 'opener' ? r.opener_opened_at : r.counterparty_opened_at)} · signed{' '}
                  {dayTime(s === 'opener' ? p.opener_signed_at : p.counterparty_signed_at)}
                </p>
                <p className="c-hash mt-1 break-all">seal {s === 'opener' ? r.opener_seal : r.counterparty_seal}</p>
              </div>
            ))}
          </div>
          <p className="c-faint mt-8 text-[13px]">
            Read from contract{' '}
            <a className="c-link mono" href={`${EXPLORER}/address/${CONTRACT}`} target="_blank" rel="noreferrer">
              {CONTRACT}
            </a>{' '}
            with get_page({p.id}). Checked {dayTime(r.checked_at)}. The notes are a reading aid and are not part of this record.
          </p>
          <p className="no-print mt-4">
            <span className="c-faint text-[13px]">Print this page or save it as PDF from your browser to keep a copy.</span>
          </p>
        </>
      )}
    </div>
  );
}
