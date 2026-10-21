'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { gen, hashShort, left, short } from '@/lib/format';
import { accountProblem, length, newSalt, sealOf } from '@/lib/hash.mjs';
import { LIMITS, TERMS, TERM_LABEL, lapsed, mentions, nowSeconds, sideOf, termsWith } from '@/lib/page';
import { downloadTicket, findTicket, onTickets, parseTicket, saveTicket, type Ticket } from '@/lib/tickets';
import type { PageFull } from '@/lib/types';
import { refreshReads, send, type TxState } from '@/lib/write';

import { TxStatus } from './TxStatus';
import { WalletGate, useWallet } from './Wallet';

/**
 * Everything a visitor can do on one page, by step: join, write and seal, open,
 * check, sign, or close a page whose window has lapsed. Writes are signed in
 * the visitor's wallet; after a decided write the page drops its cached reads
 * and re-renders from the chain.
 */
export function PageActions({ p }: { p: PageFull }) {
  const w = useWallet();
  const router = useRouter();
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const [now, setNow] = useState(() => nowSeconds());
  useEffect(() => {
    const timer = setInterval(() => setNow(nowSeconds()), 15000);
    return () => clearInterval(timer);
  }, []);

  const side = sideOf(p, w.account);
  const other = side === 'opener' ? 'counterparty' : 'opener';
  const r = p.rounds[p.round - 1];
  const busy = tx.phase === 'signing' || tx.phase === 'deciding';

  async function write(method: string, args: unknown[], value = 0n) {
    const state = await send(w.account, method, args, value, setTx);
    if (state.phase === 'done' || state.phase === 'refused') {
      await refreshReads(['pages', `page:${p.id}`, `account:${w.account.toLowerCase()}`, `account:${p.opener.toLowerCase()}`, `account:${p.counterparty.toLowerCase()}`]);
      w.refreshBalance();
      router.refresh();
    }
    return state;
  }

  if (p.status !== 'OPEN') {
    return (
      <div className="c-card pad flex flex-col gap-2">
        <p className="c-h3">This page is closed: {p.status.replace('_', ' ').toLowerCase()}.</p>
        <p className="c-muted text-[14px]">
          Deposits were credited when it closed: {short(p.opener)} {gen(p.opener_payout)}, {short(p.counterparty)} {gen(p.counterparty_payout)}. Each side
          withdraws from <a className="c-link" href="/me">My pages</a>.
        </p>
      </div>
    );
  }

  if (lapsed(p, now)) {
    return (
      <div className="c-card pad flex flex-col items-start gap-3">
        <p className="c-h3">The window for this step closed {left(now, p.step_end)} ago</p>
        <p className="c-muted text-[14px]">
          {p.step === 'CHECK'
            ? 'Nobody was absent: the check never reached a verdict in its window. Closing it returns both deposits.'
            : 'A side that missed this step loses its deposit to the other. If both missed it, each gets their own back. Anyone may close it.'}
        </p>
        <WalletGate action="close this page">
          <button className="c-btn solid" disabled={busy} onClick={() => write('no_show', [p.id])}>
            Close as no-show
          </button>
        </WalletGate>
        <TxStatus state={tx} onRetry={() => write('no_show', [p.id])} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="c-faint text-[13.5px]">
        This step&apos;s window closes in <span className="mono c-muted">{left(p.step_end, now)}</span>.
      </p>
      {p.step === 'JOIN' && <JoinStep p={p} side={side} busy={busy} write={write} />}
      {p.step === 'SEAL' && side && (
        <SealStep p={p} side={side} busy={busy} write={write} sealed={(side === 'opener' ? r.opener_seal : r.counterparty_seal) !== ''} otherSeal={other === 'opener' ? r.opener_seal : r.counterparty_seal} />
      )}
      {p.step === 'SEAL' && !side && <Watching p={p} what="Both sides are writing and sealing." />}
      {p.step === 'REVEAL' && side && <RevealStep p={p} busy={busy} write={write} opened={(side === 'opener' ? r.opener_opened_at : r.counterparty_opened_at) > 0} seal={side === 'opener' ? r.opener_seal : r.counterparty_seal} />}
      {p.step === 'REVEAL' && !side && <Watching p={p} what="Both have sealed. Each side now opens its account." />}
      {p.step === 'CHECK' && (
        <div className="c-card pad flex flex-col items-start gap-3">
          <p className="c-h3">Both accounts are open. Check them.</p>
          <p className="c-muted text-[14px]">
            Anyone may send the check. Validators compare the two accounts on six terms, each asking in both orders, and agree on
            six statuses. It takes a minute or two.
          </p>
          <WalletGate action="check this round">
            <button className="c-btn solid" disabled={busy} onClick={() => write('check', [p.id])}>
              Check round {p.round}
            </button>
          </WalletGate>
        </div>
      )}
      {p.step === 'SIGN' && side && (
        <div className="c-card pad flex flex-col items-start gap-3">
          <p className="c-h3">Same page. Sign the record.</p>
          <p className="c-muted text-[14px]">
            You sign both full accounts and the six statuses, not the notes. When both have signed, both {gen(p.deposit)} deposits come back.
          </p>
          {(side === 'opener' ? p.opener_signed_at : p.counterparty_signed_at) > 0 ? (
            <p className="c-note accent">You signed. Waiting for {short(side === 'opener' ? p.counterparty : p.opener)}.</p>
          ) : (
            <WalletGate action="sign">
              <button className="c-btn solid" disabled={busy} onClick={() => write('sign', [p.id])}>
                Sign the record
              </button>
            </WalletGate>
          )}
        </div>
      )}
      {p.step === 'SIGN' && !side && <Watching p={p} what="Same page. Waiting for both signatures." />}
      <TxStatus state={tx} />
    </div>
  );
}

type Write = (method: string, args: unknown[], value?: bigint) => Promise<TxState>;

function Watching({ p, what }: { p: PageFull; what: string }) {
  return (
    <div className="c-note">
      {what} Only {short(p.opener)} and {short(p.counterparty)} can act on this page; anyone may send the check once both are open, or
      close it if a window lapses.
    </div>
  );
}

function JoinStep({ p, side, busy, write }: { p: PageFull; side: string; busy: boolean; write: Write }) {
  if (side === 'counterparty') {
    return (
      <div className="c-card pad flex flex-col items-start gap-3">
        <p className="c-h3">You are named on this page</p>
        <p className="c-muted text-[14px]">
          Join with the same {gen(p.deposit)} deposit. Then you write the deal in your own words; nobody sees it until both of you
          have sealed.
        </p>
        <WalletGate action="join">
          <button className="c-btn solid" disabled={busy} onClick={() => write('join', [p.id], BigInt(p.deposit))}>
            Join{BigInt(p.deposit) > 0n ? ` with ${gen(p.deposit)}` : ''}
          </button>
        </WalletGate>
      </div>
    );
  }
  return (
    <div className="c-note">
      Waiting for {short(p.counterparty)} to join. {side === 'opener' ? 'Send them this page’s link.' : 'Only that address can join.'}
    </div>
  );
}

function SealStep({ p, side, busy, write, sealed, otherSeal }: { p: PageFull; side: 'opener' | 'counterparty'; busy: boolean; write: Write; sealed: boolean; otherSeal: string }) {
  const w = useWallet();
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<Ticket | undefined>();
  useEffect(() => {
    const read = () => setSaved(findTicket(p.id, p.round, w.account));
    read();
    return onTickets(read);
  }, [p.id, p.round, w.account]);
  const previous = p.round > 1 ? p.rounds[p.round - 2] : undefined;
  const mine = previous ? (side === 'opener' ? previous.opener_text : previous.counterparty_text) : '';
  const hint = mentions(text);
  const problem = accountProblem(text, LIMITS.account);

  async function sealIt() {
    if (problem) return;
    const salt = newSalt();
    const seal = await sealOf(text, salt, w.account);
    const ok = saveTicket({ pageId: p.id, round: p.round, account: w.account, text, salt, seal, title: p.title });
    if (!ok) {
      downloadTicket({ pageId: p.id, round: p.round, account: w.account, text, salt, seal, title: p.title, contract: '', chainId: 0, savedAt: new Date().toISOString() });
    }
    await write('seal', [p.id, seal]);
  }

  if (sealed) {
    return (
      <div className="c-card pad flex flex-col gap-3">
        <p className="c-h3">Your account is sealed</p>
        <p className="c-muted text-[14px]">
          {otherSeal ? 'Both are sealed.' : `Waiting for ${short(side === 'opener' ? p.counterparty : p.opener)} to seal.`} Your ticket holds the exact text and salt; without it your
          account cannot be opened.
        </p>
        {saved ? (
          <button className="c-btn small self-start" onClick={() => downloadTicket(saved)}>
            Download my ticket
          </button>
        ) : (
          <p className="c-note">This browser has no ticket for this seal. Open it from the browser or the file you sealed with.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="c-card pad flex flex-col gap-3">
        <p className="c-eyebrow">The deal, in your own words · round {p.round} of 2</p>
        <textarea
          className="c-textarea c-account"
          style={{ minHeight: 170 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What is delivered, for how much, by when, how and when it is paid, who may use the result, and what happens if either side backs out."
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <span className="c-faint">Any language, any order. Public once both open.</span>
          <span className="mono c-faint">
            {length(text).toLocaleString('en-US')} / {LIMITS.account.toLocaleString('en-US')}
          </span>
        </div>
        {previous && (
          <div className="c-note">
            Round {previous.number} {previous.verdict === 'GAPS' ? 'left out' : 'differed on'}{' '}
            <span className="mono">
              {(previous.verdict === 'GAPS' ? termsWith(previous, 'ABSENT') : termsWith(previous, 'DIFFER')).map((t) => TERM_LABEL[t]).join(', ').toUpperCase()}
            </span>
            . Settle these with the other side before you seal.
            {mine && (
              <button className="c-link ml-2" onClick={() => setText(mine)}>
                Start from my round {previous.number} text
              </button>
            )}
          </div>
        )}
        <WalletGate action="seal your account">
          <div className="flex flex-col items-start gap-2">
            <button className="c-btn solid" disabled={busy || !!problem} onClick={sealIt}>
              Seal my account
            </button>
            {problem && text && <p className="c-faint text-[13px]">{problem}</p>}
            <p className="c-faint text-[13px]">Your ticket is saved in this browser before you sign.</p>
          </div>
        </WalletGate>
      </div>
      <aside className="flex flex-col gap-4">
        <div className="c-card pad">
          <p className="c-eyebrow">Terms your text mentions</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {TERMS.map((t) => (
              <div key={t} className={`c-term-line ${hint[t] ? '' : 'absent'}`}>
                <span>{TERM_LABEL[t]}</span>
                <span className="mono text-[12px]">{hint[t] ? 'mentioned' : 'not yet'}</span>
              </div>
            ))}
          </div>
          <p className="c-faint mt-3 text-[12.5px]">A hint from your text only, worked out in this browser. The validators read both.</p>
        </div>
        <div className="c-card pad">
          <p className="c-eyebrow">What the other side sees now</p>
          <p className="mono mt-3 text-[13px]">
            {short(side === 'opener' ? p.counterparty : p.opener)}: {otherSeal ? `sealed ${hashShort(otherSeal)}` : 'not sealed yet'}
          </p>
          <p className="mono text-[13px]">you: not sealed yet</p>
          <p className="c-faint mt-2 text-[12.5px]">Nothing else, until you both open.</p>
        </div>
      </aside>
    </div>
  );
}

function RevealStep({ p, busy, write, opened, seal }: { p: PageFull; busy: boolean; write: Write; opened: boolean; seal: string }) {
  const w = useWallet();
  const [ticket, setTicket] = useState<Ticket | undefined>();
  const [problem, setProblem] = useState('');
  useEffect(() => {
    const read = () => setTicket(findTicket(p.id, p.round, w.account, seal));
    read();
    return onTickets(read);
  }, [p.id, p.round, w.account, seal]);

  if (opened) return <div className="c-note accent">Your account is open. Waiting for the other side to open theirs.</div>;

  async function fromFile(file: File) {
    const t = parseTicket(await file.text());
    if (!t) return setProblem('That file is not a Samepage ticket.');
    if (t.seal !== seal) return setProblem('That ticket is for a different seal.');
    saveTicket(t);
    setProblem('');
  }

  return (
    <div className="c-card pad flex flex-col items-start gap-3">
      <p className="c-h3">Both sealed. Open your account.</p>
      <p className="c-muted text-[14px]">
        The contract checks your text and salt against your seal {hashShort(seal)}. Once both are open, anyone can check them.
      </p>
      {ticket ? (
        <>
          <p className="c-account c-card w-full p-3 text-[14.5px]">{ticket.text}</p>
          <WalletGate action="open your account">
            <button className="c-btn solid" disabled={busy} onClick={() => write('reveal', [p.id, ticket.text, ticket.salt])}>
              Open my account
            </button>
          </WalletGate>
        </>
      ) : (
        <>
          <p className="c-note">This browser has no ticket for your seal. Load the ticket file you downloaded when you sealed.</p>
          <input type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0] && fromFile(e.target.files[0])} />
          {problem && <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{problem}</p>}
        </>
      )}
    </div>
  );
}
