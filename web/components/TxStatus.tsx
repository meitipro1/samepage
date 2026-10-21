'use client';

import { useEffect, useState } from 'react';

import type { TxState } from '@/lib/write';

import { Tx } from './ui';

const WAITING: Record<string, string> = {
  check: 'Validators are comparing the two accounts on six terms. Each one asks its own model in both orders, then they compare the six statuses. This takes a minute or two.',
  seal: 'Validators are recording your seal.',
  join: 'Validators are recording your join and deposit.',
  sign: 'Validators are recording your signature.',
  no_show: 'Validators are closing the page and moving the deposits.',
  reveal: 'Validators are checking your account against your seal.',
  open_page: 'Validators are recording the page and your deposit.',
  withdraw: 'Validators are sending your balance.',
};

/** What a write is doing right now, with its transaction link, in words. */
export function TxStatus({ state, onRetry }: { state: TxState; onRetry?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state.phase !== 'deciding') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.phase]);
  if (state.phase === 'idle') return null;
  const elapsed = state.startedAt ? Math.round((now - state.startedAt) / 1000) : 0;
  return (
    <div className={`c-note ${state.phase === 'done' ? 'accent' : ''} flex flex-col gap-1.5`} role="status" aria-live="polite">
      {state.phase === 'signing' && <p>Confirm the transaction in your wallet.</p>}
      {state.phase === 'deciding' && (
        <p className="flex items-start gap-2">
          <span className="c-spin mt-1 shrink-0" aria-hidden />
          <span>
            {WAITING[state.method ?? ''] ?? 'Waiting for validators.'} <span className="mono c-faint">{elapsed}s</span>
          </span>
        </p>
      )}
      {state.phase === 'done' && <p>Done{state.seconds ? ` in ${state.seconds}s` : ''}. Accepted by the validators.</p>}
      {state.phase === 'refused' && (
        <p>
          <span className="font-medium">The contract refused it:</span> {state.message}
        </p>
      )}
      {state.phase === 'error' && <p>{state.message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {state.hash && <Tx hash={state.hash} label="transaction" />}
        {(state.phase === 'error' || state.phase === 'refused') && onRetry && (
          <button className="c-btn small" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
