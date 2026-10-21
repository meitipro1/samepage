'use client';

/**
 * Tickets: the exact text and the salt behind a seal. Without them a sealed
 * account cannot be opened, and a side that cannot open misses the window and
 * loses its deposit to the other.
 *
 * Every ticket is saved in this browser before the seal is signed, and offered
 * as a download. Nothing here leaves the browser.
 */

import { CHAIN_ID, CONTRACT } from './genlayer-core.mjs';

export type Ticket = {
  contract: string;
  chainId: number;
  pageId: number;
  round: number;
  account: string;
  text: string;
  salt: string;
  /** The seal this ticket opens. */
  seal: string;
  title?: string;
  savedAt: string;
};

const KEY = 'samepage:tickets:v1';
const EVENT = 'samepage-tickets';

function all(): Ticket[] {
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Ticket[]) : [];
}

export function loadTickets(): Ticket[] {
  try {
    return all().filter((t) => t.contract?.toLowerCase() === String(CONTRACT).toLowerCase());
  } catch {
    return [];
  }
}

/** Save or update a ticket, matched by its seal. Returns false when this browser refuses storage. */
export function saveTicket(ticket: Omit<Ticket, 'contract' | 'chainId' | 'savedAt'>): boolean {
  try {
    const full: Ticket = { ...ticket, contract: String(CONTRACT), chainId: CHAIN_ID, savedAt: new Date().toISOString() };
    const rest = all().filter((t) => t.seal !== full.seal);
    window.localStorage.setItem(KEY, JSON.stringify([...rest, full]));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

export function findTicket(pageId: number, round: number, account: string, seal?: string): Ticket | undefined {
  return loadTickets().find(
    (t) => t.pageId === pageId && t.round === round && t.account.toLowerCase() === account.toLowerCase() && (!seal || t.seal === seal),
  );
}

export function onTickets(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', fn);
  };
}

export function downloadTicket(t: Ticket): void {
  const blob = new Blob([JSON.stringify(t, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `samepage-ticket-page-${t.pageId}-round-${t.round}-${t.seal.slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A ticket file read back, or null when it is not one. */
export function parseTicket(text: string): Ticket | null {
  try {
    const t = JSON.parse(text) as Ticket;
    if (typeof t.salt !== 'string' || typeof t.text !== 'string' || !/^[0-9a-f]{64}$/.test(t.seal) || typeof t.pageId !== 'number') return null;
    return t;
  } catch {
    return null;
  }
}
