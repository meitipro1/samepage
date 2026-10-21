import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageActions } from '@/components/PageActions';
import { Addr, ReadError, StepBadge, TermTable, Tx, VerdictBadge } from '@/components/ui';
import { pageTxs } from '@/lib/explorer';
import { day, dayTime, gen, hashShort, short } from '@/lib/format';
import { TERM_LABEL, lastChecked, nowSeconds, termsWith } from '@/lib/page';
import { getPage, readError } from '@/lib/read';
import type { PageFull, Round } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await getPage(Number(id));
    if (p.found) return { title: `${p.title} · page ${p.id}`, description: `Two accounts of one deal: ${p.title}. Page ${p.id} on Samepage.` };
  } catch {
    /* the page itself reports the read error */
  }
  return { title: `Page ${id}` };
}

/** One sentence on what the last verdict means and what comes next. */
function nextLine(p: PageFull, r: Round): string {
  const differ = termsWith(r, 'DIFFER').map((t) => TERM_LABEL[t].toLowerCase());
  const gaps = termsWith(r, 'ABSENT')
    .filter((t) => ['amount', 'deliverable', 'deadline'].includes(t))
    .map((t) => TERM_LABEL[t].toLowerCase());
  if (r.verdict === 'SAME_PAGE') {
    return p.status === 'AGREED' ? 'Both described the same deal, and both signed.' : 'Both describe the same deal. Each side signs the record.';
  }
  const what = r.verdict === 'DIFFERENT' ? `The two accounts differ on ${differ.join(' and ')}.` : `Neither account states ${gaps.join(' or ')}.`;
  if (p.status === 'NOT_AGREED') return `${what} That was round 2, so the page closed as not agreed and both deposits came back.`;
  if (r.number === 1) return `${what} Talk it through, then each side writes round 2.`;
  return what;
}

export default async function PageView({ params }: { params: Promise<{ id: string }> }) {
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
  if (!p) {
    return (
      <div className="c-wrap py-12">
        <ReadError message={error} />
      </div>
    );
  }
  const now = nowSeconds();
  const txs = await pageTxs(id);
  const last = lastChecked(p.rounds);
  const deposit = BigInt(p.deposit);

  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">
        Page #{p.id} · round {p.round} of 2 · {p.status === 'OPEN' ? p.step.toLowerCase() : p.status.replace('_', ' ').toLowerCase()}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h1 className="c-h2">{p.title}</h1>
        <StepBadge p={p} now={now} />
      </div>
      <p className="c-muted mt-3 text-[14.5px]">
        <Addr address={p.opener} /> opened{p.joined_at ? ', ' : ' and named '}
        <Addr address={p.counterparty} />
        {p.joined_at ? ' joined' : ''} · {gen(p.deposit)} deposit each · {p.window_hours} h per step · opened {day(p.opened_at)}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          {last && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="c-eyebrow">Result of round {last.number}</p>
                <VerdictBadge verdict={last.verdict} count={last.count} big />
              </div>
              <p className="text-[16px]">{nextLine(p, last)}</p>
              <TermTable r={last} />
              <p className="c-faint text-[13px]">
                Lines are the leader&apos;s notes, a reading aid. The record is both full accounts and the six statuses. Checked{' '}
                {dayTime(last.checked_at)} by <Addr address={last.checked_by} />.
              </p>
            </section>
          )}

          <section>
            <PageActions p={p} />
          </section>

          {p.rounds
            .filter((r) => r.opener_text || r.counterparty_text)
            .reverse()
            .map((r) => (
              <section key={r.number} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <p className="c-eyebrow">Round {r.number}, full accounts</p>
                  <VerdictBadge verdict={r.verdict} count={r.count} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(['opener', 'counterparty'] as const).map((s) => (
                    <div key={s} className="c-card pad">
                      <p className="c-eyebrow">
                        {short(s === 'opener' ? p.opener : p.counterparty)} wrote{' '}
                        <span className="c-faint normal-case tracking-normal">· opened {dayTime(s === 'opener' ? r.opener_opened_at : r.counterparty_opened_at)}</span>
                      </p>
                      {(s === 'opener' ? r.opener_text : r.counterparty_text) ? (
                        <p className="c-account mt-3">{s === 'opener' ? r.opener_text : r.counterparty_text}</p>
                      ) : (
                        <p className="c-hash mt-3">sealed {hashShort(s === 'opener' ? r.opener_seal : r.counterparty_seal)}, not opened</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="c-card pad">
            <p className="c-eyebrow">Deposits</p>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 text-[14px]">
              <dt className="c-muted">Each side</dt>
              <dd className="mono">{gen(p.deposit)}</dd>
              <dt className="c-muted">Back when</dt>
              <dd>both sign</dd>
              <dt className="c-muted">If round 2 differs</dt>
              <dd>back to both</dd>
              <dt className="c-muted">If a side vanishes</dt>
              <dd>to the other</dd>
            </dl>
            {p.status !== 'OPEN' && deposit > 0n && (
              <p className="c-note mt-4">
                Credited at close: {short(p.opener)} {gen(p.opener_payout)}, {short(p.counterparty)} {gen(p.counterparty_payout)}.
              </p>
            )}
            {p.absent.length > 0 && (
              <p className="c-dotted mt-4 p-3 text-[13.5px]">
                No-show recorded against {p.absent.map((a) => short(a)).join(' and ')}.
              </p>
            )}
          </div>

          <div className="c-card pad">
            <p className="c-eyebrow">Seals, round {p.round}</p>
            <p className="mono mt-3 text-[13px]">
              {short(p.opener)}: {p.rounds[p.round - 1].opener_seal ? `sealed ${hashShort(p.rounds[p.round - 1].opener_seal)}` : 'not sealed'}
            </p>
            <p className="mono text-[13px]">
              {short(p.counterparty)}: {p.rounds[p.round - 1].counterparty_seal ? `sealed ${hashShort(p.rounds[p.round - 1].counterparty_seal)}` : 'not sealed'}
            </p>
            {(p.opener_signed_at > 0 || p.counterparty_signed_at > 0) && (
              <>
                <p className="c-eyebrow mt-4">Signatures</p>
                <p className="mono mt-2 text-[13px]">
                  {short(p.opener)}: {p.opener_signed_at ? dayTime(p.opener_signed_at) : 'not yet'}
                </p>
                <p className="mono text-[13px]">
                  {short(p.counterparty)}: {p.counterparty_signed_at ? dayTime(p.counterparty_signed_at) : 'not yet'}
                </p>
              </>
            )}
            {p.status === 'AGREED' && (
              <Link className="c-btn small solid mt-4" href={`/p/${p.id}/record`}>
                The agreed record
              </Link>
            )}
          </div>

          {txs.length > 0 && (
            <div className="c-card pad">
              <p className="c-eyebrow">On the explorer</p>
              <div className="mt-3 flex flex-col gap-1.5">
                {[...txs].reverse().map((t) => (
                  <div key={t.hash} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="mono c-muted">{t.method}</span>
                    <Tx hash={t.hash} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
