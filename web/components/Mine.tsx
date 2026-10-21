'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { gen, left } from '@/lib/format';
import { lapsed, nowSeconds, sideOf } from '@/lib/page';
import { downloadTicket, loadTickets, onTickets, type Ticket } from '@/lib/tickets';
import type { PageItem, PageList } from '@/lib/types';
import { refreshReads, send, type TxState } from '@/lib/write';

import { TxStatus } from './TxStatus';
import { PageRow } from './ui';
import { WalletGate, useWallet } from './Wallet';

/** Whether this page waits on the connected side right now. */
function myTurn(p: PageItem, account: string, now: number): boolean {
  if (p.status !== 'OPEN' || lapsed(p, now)) return false;
  const side = sideOf(p, account);
  if (p.step === 'JOIN') return side === 'counterparty';
  if (p.step === 'SIGN') return side === 'opener' ? p.opener_signed_at === 0 : p.counterparty_signed_at === 0;
  return p.step !== 'CHECK';
}

/**
 * My pages: every page the connected account opened or was named in, the ones
 * waiting on it first with their windows, its balance and the withdraw, and
 * this browser's tickets.
 */
export function Mine() {
  const w = useWallet();
  const [data, setData] = useState<PageList | null>(null);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tx, setTx] = useState<TxState>({ phase: 'idle' });
  const [now, setNow] = useState(() => nowSeconds());

  const reload = useCallback(async () => {
    if (!w.account) return;
    try {
      const response = await fetch(`/api/account/${w.account}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) setError(body.error ?? 'The chain did not answer.');
      else {
        setData(body);
        setError('');
      }
    } catch {
      setError('The chain did not answer. Reload in a moment.');
    }
  }, [w.account]);

  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    const read = () => setTickets(loadTickets());
    read();
    return onTickets(read);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(nowSeconds()), 15000);
    return () => clearInterval(timer);
  }, []);

  async function withdraw() {
    const state = await send(w.account, 'withdraw', [], 0n, setTx);
    if (state.phase === 'done' || state.phase === 'refused') {
      await refreshReads(['pages', `account:${w.account.toLowerCase()}`]);
      reload();
      w.refreshBalance();
    }
  }

  const items = data?.items ?? [];
  const waiting = items.filter((p) => myTurn(p, w.account, now)).sort((a, b) => a.step_end - b.step_end);
  const rest = items.filter((p) => !waiting.includes(p));
  const balance = BigInt(data?.balance ?? '0');
  const you = w.account.toLowerCase();

  return (
    <WalletGate action="see your pages">
      <div className="flex flex-col gap-10">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="c-card pad">
            <p className="c-eyebrow">Balance in the contract</p>
            <p className="mono mt-2 text-[28px]">{gen(balance)}</p>
            <p className="c-faint mt-1 text-[13px]">Deposits credited back to you or won from a no-show. Withdrawn so far: {gen(data?.withdrawn ?? '0')}.</p>
            <div className="mt-4 flex flex-col items-start gap-3">
              <button className="c-btn solid" disabled={balance === 0n || tx.phase === 'signing' || tx.phase === 'deciding'} onClick={withdraw}>
                Withdraw {balance > 0n ? gen(balance) : ''}
              </button>
              <TxStatus state={tx} onRetry={withdraw} />
            </div>
          </div>
          <div className="c-card pad">
            <p className="c-eyebrow">Tickets in this browser</p>
            {tickets.length === 0 ? (
              <p className="c-muted mt-2 text-[14px]">None. A ticket is saved here each time you seal an account.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {tickets.map((t) => (
                  <div key={t.seal} className="flex items-center gap-3 text-[13.5px]">
                    <Link className="c-link" href={`/p/${t.pageId}`}>
                      Page #{t.pageId}, round {t.round}
                    </Link>
                    <span className="c-faint truncate">{t.title}</span>
                    <button className="c-btn small ml-auto" onClick={() => downloadTicket(t)}>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <div className="c-note">{error}</div>}

        <section>
          <p className="c-eyebrow">Waiting on you</p>
          <div className="c-card mt-3 divide-y divide-[var(--line)]">
            {waiting.length === 0 ? (
              <p className="c-muted px-4 py-4 text-[14px]">{data ? 'Nothing is waiting on you right now.' : 'Reading…'}</p>
            ) : (
              waiting.map((p) => (
                <div key={p.id}>
                  <PageRow p={p} now={now} you={you} />
                  <p className="c-faint px-4 pb-3 text-[12.5px]">Window closes in {left(p.step_end, now)}.</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <p className="c-eyebrow">All my pages</p>
          <div className="c-card mt-3 divide-y divide-[var(--line)]">
            {rest.length === 0 ? (
              <p className="c-muted px-4 py-4 text-[14px]">
                {data ? (
                  <>
                    No other pages. <Link className="c-link" href="/new">Open a page</Link>.
                  </>
                ) : (
                  'Reading…'
                )}
              </p>
            ) : (
              rest.map((p) => <PageRow key={p.id} p={p} now={now} you={you} />)
            )}
          </div>
        </section>
      </div>
    </WalletGate>
  );
}
