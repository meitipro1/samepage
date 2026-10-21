'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { gen, toWei } from '@/lib/format';
import { LIMITS, TERMS, TERM_LABEL } from '@/lib/page';
import { TEMPLATES, template } from '@/lib/templates';
import { refreshReads, send, type TxState } from '@/lib/write';

import { TxStatus } from './TxStatus';
import { WalletGate, useWallet } from './Wallet';

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function OpenForm() {
  const w = useWallet();
  const router = useRouter();
  const params = useSearchParams();
  const [slug, setSlug] = useState(params.get('template') ?? '');
  const chosen = template(slug);
  const [title, setTitle] = useState(chosen?.title ?? '');
  const [counterparty, setCounterparty] = useState('');
  const [deposit, setDeposit] = useState('20');
  const [hours, setHours] = useState('48');
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const [opened, setOpened] = useState<number | null>(null);

  const wei = toWei(deposit);
  const windowHours = Number(hours);
  const problem = useMemo(() => {
    const name = title.split(/\s+/).filter(Boolean).join(' ');
    if (!name) return 'Give the deal a title.';
    if (name.length > LIMITS.title) return `The title is at most ${LIMITS.title} characters.`;
    if (!ADDRESS.test(counterparty.trim())) return 'Paste the counterparty’s wallet address, 0x and 40 hex characters.';
    if (w.account && counterparty.trim().toLowerCase() === w.account.toLowerCase()) return 'The counterparty is the other side, not you.';
    if (wei === null) return 'The deposit is a number of GEN, 0 or more.';
    if (!Number.isInteger(windowHours) || windowHours < LIMITS.minWindow || windowHours > LIMITS.maxWindow) return `Each step’s window is ${LIMITS.minWindow} to ${LIMITS.maxWindow} hours.`;
    return '';
  }, [title, counterparty, wei, windowHours, w.account]);

  async function submit() {
    if (problem || wei === null) return;
    const name = title.split(/\s+/).filter(Boolean).join(' ');
    const state = await send(w.account, 'open_page', [name, counterparty.trim(), wei, BigInt(windowHours)], wei, setTx);
    if (state.phase === 'done') {
      const id = Number(state.returned);
      setOpened(id);
      await refreshReads(['pages', `account:${w.account.toLowerCase()}`]);
      w.refreshBalance();
      router.prefetch(`/p/${id}`);
    }
  }

  if (opened !== null) {
    const link = typeof globalThis.location !== 'undefined' ? `${globalThis.location.origin}/p/${opened}` : `/p/${opened}`;
    return (
      <div className="c-card pad flex max-w-[640px] flex-col gap-4">
        <p className="c-eyebrow">Page #{opened} is open</p>
        <p className="c-h3">Send this link to the other side</p>
        <p className="c-pre">{link}</p>
        <p className="c-muted text-[14px]">
          They join with the same {wei !== null ? gen(wei) : ''} deposit within {windowHours} hours. Then each of you writes the deal in
          your own words and seals it. Neither sees the other&apos;s account until both are sealed.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="c-btn solid" href={`/p/${opened}`}>
            Go to page #{opened}
          </Link>
          <button className="c-btn" onClick={() => navigator.clipboard?.writeText(link)}>
            Copy the link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-6">
        <div>
          <label className="c-label" htmlFor="tpl">
            Start from a template (term hints only, never a prefilled account)
          </label>
          <select
            id="tpl"
            className="c-select"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              const t = template(e.target.value);
              if (t && !title) setTitle(t.title);
            }}
          >
            <option value="">No template</option>
            {TEMPLATES.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="c-label" htmlFor="title">
            Title, public, at most {LIMITS.title} characters
          </label>
          <input id="title" className="c-input" value={title} maxLength={LIMITS.title + 20} onChange={(e) => setTitle(e.target.value)} placeholder="Kiln launch posts" />
        </div>
        <div>
          <label className="c-label" htmlFor="cp">
            The counterparty&apos;s wallet address: the only account that can join
          </label>
          <input id="cp" className="c-input mono" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="0x…" spellCheck={false} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="c-label" htmlFor="dep">
              Good-faith deposit, GEN, paid by each side
            </label>
            <input id="dep" className="c-input mono" value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="c-label" htmlFor="win">
              Window for each step, hours ({LIMITS.minWindow} to {LIMITS.maxWindow})
            </label>
            <input id="win" className="c-input mono" value={hours} onChange={(e) => setHours(e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div className="c-note">
          You send the deposit now. It comes back when both sign, or when two rounds still differ. A side that misses a window
          to join, seal, open or sign loses its deposit to the other.
        </div>
        <WalletGate action="open a page">
          <div className="flex flex-col items-start gap-3">
            <button className="c-btn solid" disabled={!!problem || tx.phase === 'signing' || tx.phase === 'deciding'} onClick={submit}>
              Open the page{wei !== null && wei > 0n ? ` with ${gen(wei)}` : ''}
            </button>
            {problem && <p className="c-faint text-[13.5px]">{problem}</p>}
            <TxStatus state={tx} onRetry={submit} />
          </div>
        </WalletGate>
      </div>
      <aside className="flex flex-col gap-4">
        <div className="c-card pad">
          <p className="c-eyebrow">{chosen ? chosen.name : 'The six terms'}</p>
          <p className="c-muted mt-2 text-[13.5px]">
            {chosen ? chosen.who : 'Each side should state these in its own account. The first three are required for the same page.'}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {TERMS.map((t) => (
              <div key={t}>
                <p className="text-[14px] font-medium">{TERM_LABEL[t]}</p>
                {chosen && <p className="c-faint text-[13px]">{chosen.hints[t]}</p>}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
