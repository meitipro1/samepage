import Link from 'next/link';

import { ReadError, StatusBadge, VerdictBadge } from '@/components/ui';
import { gen, short } from '@/lib/format';
import { TERMS, TERM_LABEL, TERM_MEANS, lastChecked, nowSeconds } from '@/lib/page';
import { allPages, getPage, readError } from '@/lib/read';
import type { PageFull, PageItem, Round, Term } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STEPS = [
  ['01', 'Write', 'Each side writes the deal in its own words, in any language and any order. Nobody fills in a form the other side wrote.'],
  ['02', 'Seal', 'Only a hash goes on chain until both are in, so neither sees the other’s account and nobody can copy or adjust to it.'],
  ['03', 'Check', 'Validators compare the two accounts on six terms and name every difference. The verdict follows from the six statuses, in code.'],
  ['04', 'Sign', 'Sign when it matches and both deposits come back. Rewrite once when it does not. Walk away and your deposit goes to the other side.'],
];

const EXAMPLES: Record<Term, string> = {
  amount: '“600 USDC” against “600 USDT” is a difference.',
  deliverable: '“3 posts and a thread” against “3 posts” is a difference.',
  deadline: '“By Friday” against “by Oct 16” differs unless the texts tie them.',
  payment: '“Half upfront” against “paid after delivery” is a difference.',
  rights: '“Kiln may repost” on one side only is a difference.',
  cancellation: 'Neither mentions it? Fine. Absent is allowed here.',
};

const FAQ: [string, React.ReactNode][] = [
  [
    'Is it a contract?',
    <>
      It is a record both sides wrote and both signed: two full accounts, six statuses, two signatures, on chain and
      timestamped. Samepage checks that the two describe the same deal. It does not judge whether the deal is fair or legal,
      and it holds no payment for the work.
    </>,
  ],
  [
    'Who sees my account?',
    <>
      Nobody, until both sides have sealed: only the hash is on chain. Once both open, both accounts are public, so write
      only what you would post. <Link className="c-link" href="/docs/concepts/sealing-and-opening">Sealing and opening</Link>.
    </>,
  ],
  [
    'What if they ghost?',
    <>
      Every step has a window, 6 to 96 hours. A side that misses one loses its deposit to the other: anyone can call
      no-show once the window closes. Two rounds that never reach the same page close with both deposits back, because
      disagreeing honestly is not ghosting.
    </>,
  ],
  [
    'Does the model decide?',
    <>
      The model labels each of six terms MATCH, DIFFER or ABSENT, asked in both orders on every validator. The validators
      agree on those six labels exactly, and the verdict is computed from them in code.{' '}
      <Link className="c-link" href="/docs/more/judge-prompt">The judge prompt, word for word</Link>.
    </>,
  ],
  [
    'Which network?',
    <>
      GenLayer Studio Next, chain 61997, with test GEN from the site&apos;s faucet.{' '}
      <Link className="c-link" href="/docs/reference/addresses">Addresses and network</Link>.
    </>,
  ],
];

function DealCard({ p }: { p: PageFull }) {
  const r = lastChecked(p.rounds) as Round;
  return (
    <div className="c-card">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
        <p className="c-eyebrow min-w-0 flex-1 truncate">
          Page #{p.id} · {p.title}
        </p>
        {p.status === 'AGREED' ? <span className="c-badge match">Agreed</span> : <VerdictBadge verdict={r.verdict} count={r.count} />}
      </div>
      <p className="c-faint px-5 pt-4 text-[13px]">
        {short(p.opener)} and {short(p.counterparty)} wrote it separately · {r.verdict === 'SAME_PAGE' ? 'same page' : 'checked'} in round {r.number}
      </p>
      <div className="flex flex-col gap-2 px-5 py-4">
        {TERMS.map((t) => (
          <div key={t} className={`c-term-line ${String(r.statuses[t] ?? '').toLowerCase()}`}>
            <span className="w-[104px] shrink-0 font-medium">{TERM_LABEL[t]}</span>
            <span className="c-muted min-w-0 flex-1 truncate text-[13.5px]">{r.notes[t] ?? (r.statuses[t] === 'ABSENT' ? 'Neither mentions it' : '')}</span>
            <StatusBadge status={r.statuses[t]} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-[var(--line)] px-5 py-3 text-[13px]">
        <span className="c-muted">
          {p.status === 'AGREED' ? `Both signed · ${gen(p.deposit)} deposits back` : `Round ${r.number} of 2`}
        </span>
        <Link className="c-link ml-auto" href={p.status === 'AGREED' ? `/p/${p.id}/record` : `/p/${p.id}`}>
          {p.status === 'AGREED' ? `record #${p.id}` : `page #${p.id}`}
        </Link>
      </div>
    </div>
  );
}

export default async function Landing() {
  const now = nowSeconds();
  let pages: PageItem[] = [];
  let hero: PageFull | undefined;
  let differ: { p: PageFull; r: Round; t: Term } | undefined;
  let error = '';
  try {
    pages = await allPages();
    const agreed = pages.find((p) => p.status === 'AGREED');
    const checked = agreed ?? pages.find((p) => p.last_verdict);
    if (checked) {
      const full = await getPage(checked.id);
      if (full.found) hero = full;
    }
    const withDiff = pages.find((p) => p.last_verdict === 'DIFFERENT') ?? (hero && hero.rounds.some((r) => r.verdict === 'DIFFERENT') ? hero : undefined);
    if (withDiff) {
      const full = withDiff.id === hero?.id ? hero : await getPage(withDiff.id);
      if (full && full.found) {
        const r = full.rounds.find((x) => x.verdict === 'DIFFERENT');
        const t = r && TERMS.find((x) => r.statuses[x] === 'DIFFER');
        if (r && t) differ = { p: full, r, t };
      }
    }
  } catch (e) {
    error = readError(e);
  }
  const recent = pages.filter((p) => p.last_verdict).slice(0, 4);

  return (
    <>
      <section className="c-wrap pb-16 pt-14 sm:pt-20">
        <div className="c-grid-2">
          <div>
            <p className="c-eyebrow">Deal checks, judged on GenLayer</p>
            <h1 className="c-h1 mt-5">
              Agree on the deal <em>before the work starts.</em>
            </h1>
            <p className="c-lead mt-6">
              Both sides write the deal in their own words, sealed so neither copies. GenLayer validators compare six terms and
              show exactly where you differ. Sign only when you are on the same page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/new" className="c-btn solid">
                Open a page
              </Link>
              <Link href={hero ? `/p/${hero.id}` : '/pages'} className="c-btn">
                See an example
              </Link>
            </div>
            <p className="c-faint mt-5 text-[14px]">Walk away mid-deal and your deposit goes to the other side.</p>
          </div>
          <div>
            {error ? <ReadError message={error} /> : hero ? <DealCard p={hero} /> : <div className="c-note">No page has been checked yet.</div>}
          </div>
        </div>
        {recent.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--line)] pt-5 text-[13.5px]">
            <span className="c-eyebrow">{recent.length} recent checks</span>
            {recent.map((p) => (
              <Link key={p.id} href={`/p/${p.id}`} className="flex items-center gap-2 hover:text-[var(--ink)]">
                <VerdictBadge verdict={p.last_verdict} count={p.last_count} />
                <span className="c-muted">{p.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="c-section" id="terms">
        <div className="c-wrap">
          <p className="c-eyebrow">Six terms</p>
          <h2 className="c-h2 mt-3 max-w-[22em]">Every deal is checked on the same six. The first three must be stated.</h2>
          <div className="c-steps mt-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {TERMS.map((t, i) => (
              <div key={t}>
                <p className="mono c-faint text-[12px]">
                  {String(i + 1).padStart(2, '0')} {i < 3 ? '· required' : '· when mentioned'}
                </p>
                <p className="c-h3 mt-2">{TERM_LABEL[t]}</p>
                <p className="c-muted mt-1 text-[14px]">The {TERM_MEANS[t]}.</p>
                <p className="c-faint mt-3 text-[13.5px]">{EXAMPLES[t]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="c-section" id="how">
        <div className="c-wrap">
          <p className="c-eyebrow">How it works</p>
          <h2 className="c-h2 mt-3">Write, seal, check, sign</h2>
          <div className="c-steps mt-10">
            {STEPS.map(([n, title, body]) => (
              <div key={n}>
                <p className="mono c-faint text-[12px]">{n}</p>
                <p className="c-h3 mt-2">{title}</p>
                <p className="c-muted mt-2 text-[14.5px] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <p className="c-faint mt-5 text-[14px]">
            At most two rounds. If round 2 still differs, the page closes as not agreed and both deposits come back.
          </p>
        </div>
      </section>

      {differ && (
        <section className="c-section">
          <div className="c-wrap c-grid-2">
            <div>
              <p className="c-eyebrow">What a difference looks like</p>
              <h2 className="c-h2 mt-3">One term, both sides, hatched</h2>
              <p className="c-lead mt-5">
                From page #{differ.p.id}, round {differ.r.number}, as checked on chain. The line is the leader&apos;s note, a
                reading aid. The record is both full accounts and the six statuses.
              </p>
              <Link className="c-btn mt-6" href={`/p/${differ.p.id}`}>
                Open page #{differ.p.id}
              </Link>
            </div>
            <div className="c-card">
              <div className="c-hatch flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
                <span className="font-medium">{TERM_LABEL[differ.t]}</span>
                <span className="ml-auto">
                  <StatusBadge status="DIFFER" />
                </span>
              </div>
              <p className="px-5 pt-4 text-[15px]">{differ.r.notes[differ.t]}</p>
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                <div>
                  <p className="c-eyebrow">{short(differ.p.opener)} wrote</p>
                  <p className="c-account mt-2 text-[14.5px]">{differ.r.opener_text}</p>
                </div>
                <div>
                  <p className="c-eyebrow">{short(differ.p.counterparty)} wrote</p>
                  <p className="c-account mt-2 text-[14.5px]">{differ.r.counterparty_text}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="c-section">
        <div className="c-wrap">
          <p className="c-eyebrow">For creators and clients</p>
          <h2 className="c-h2 mt-3">The gap shows up before the work, when it costs one message</h2>
          <div className="c-steps mt-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div>
              <p className="c-h3">Creators and freelancers</p>
              <p className="c-muted mt-2 text-[14.5px] leading-relaxed">
                Write what you think you agreed and see where the client thinks differently, before you spend a day on it.
              </p>
            </div>
            <div>
              <p className="c-h3">Projects and clients</p>
              <p className="c-muted mt-2 text-[14.5px] leading-relaxed">
                A record both sides wrote and signed, with no room for “that is not what we agreed” later.
              </p>
            </div>
            <div>
              <p className="c-h3">Traders and partners</p>
              <p className="c-muted mt-2 text-[14.5px] leading-relaxed">
                A good-faith deposit that a side who walks away loses to the other, and a clean record of the terms.
              </p>
            </div>
          </div>
          <p className="c-faint mt-5 text-[14px]">
            The deposit protects the step, not the work: it comes back when both sign, or when two honest rounds still differ.
          </p>
        </div>
      </section>

      <section className="c-section">
        <div className="c-wrap">
          <p className="c-eyebrow">FAQ</p>
          <div className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FAQ.map(([q, a]) => (
              <div key={q}>
                <p className="c-h3">{q}</p>
                <p className="c-muted mt-2 text-[15px] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
          {pages.length > 0 && (
            <p className="c-faint mt-12 text-[13.5px]">
              {pages.length} pages on the contract so far, {pages.filter((p) => p.status === 'AGREED').length} agreed. Read at{' '}
              {new Date(now * 1000).toISOString().slice(11, 16)} UTC.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
