import contract from './contract.generated.json';
import type { Page, PageItem, Round, Status, Term, Verdict } from './types';

/**
 * Where a page is, from the stored step and window and the reader's clock.
 * The contract's views never read the clock (a view has no transaction time),
 * so whether a window is still open is computed here, the same way on the
 * server and in the browser.
 */

export const TERMS = contract.terms as Term[];
export const REQUIRED = contract.required as Term[];
export const LIMITS = contract.limits;

export const TERM_LABEL: Record<Term, string> = {
  amount: 'Amount',
  deliverable: 'Deliverable',
  deadline: 'Deadline',
  payment: 'Payment',
  rights: 'Rights',
  cancellation: 'Cancellation',
};

/** One line on what each term covers: the rubric's own words. */
export const TERM_MEANS: Record<Term, string> = {
  amount: 'the price, the currency and any quantity',
  deliverable: 'what exactly is delivered or done',
  deadline: 'when it is due',
  payment: 'when and how payment is made',
  rights: 'who owns or may use the result',
  cancellation: 'what happens if either side backs out',
};

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** True when the current step's window has closed and the page is still open: anyone may call no_show. */
export function lapsed(p: Pick<Page, 'status' | 'step_end'>, now = nowSeconds()): boolean {
  return p.status === 'OPEN' && now >= p.step_end;
}

export const STEP_LABEL: Record<Page['step'], string> = {
  JOIN: 'Waiting to join',
  SEAL: 'Writing and sealing',
  REVEAL: 'Opening',
  CHECK: 'Ready to check',
  SIGN: 'Signing',
  DONE: 'Closed',
};

export const STATUS_LABEL: Record<Page['status'], string> = {
  OPEN: 'Open',
  AGREED: 'Agreed',
  NOT_AGREED: 'Not agreed',
  NO_SHOW: 'No show',
};

export function stepLabel(p: Pick<Page, 'status' | 'step' | 'step_end'>, now = nowSeconds()): string {
  if (p.status !== 'OPEN') return STATUS_LABEL[p.status];
  if (lapsed(p, now)) return 'Window closed';
  return STEP_LABEL[p.step];
}

export function verdictLabel(verdict: Verdict | '', count = 0): string {
  if (!verdict) return '';
  if (verdict === 'SAME_PAGE') return 'Same page';
  return `${verdict === 'DIFFERENT' ? 'Different' : 'Gaps'} · ${count}`;
}

/** The round whose verdict is on record last: the current one once checked, else the one before. */
export function lastChecked(rounds: Round[]): Round | undefined {
  return [...rounds].reverse().find((r) => r.verdict);
}

export function termsWith(r: Round, status: Status): Term[] {
  return TERMS.filter((t) => r.statuses[t] === status);
}

export function sideOf(p: Pick<Page, 'opener' | 'counterparty'>, account: string): 'opener' | 'counterparty' | '' {
  const a = account.toLowerCase();
  if (!a) return '';
  if (p.opener.toLowerCase() === a) return 'opener';
  if (p.counterparty.toLowerCase() === a) return 'counterparty';
  return '';
}

/** One sentence for the list: what the page is waiting on, or how it ended. */
export function pageLine(p: PageItem, now = nowSeconds()): string {
  if (p.status === 'AGREED') return 'Both signed. Deposits back.';
  if (p.status === 'NOT_AGREED') return 'Two rounds without the same page. Deposits back to both.';
  if (p.status === 'NO_SHOW') return 'A side missed a window. Its deposit went to the other.';
  if (lapsed(p, now)) return 'The window closed. Anyone may close it as a no-show.';
  if (p.step === 'JOIN') return 'Waiting for the counterparty to join.';
  if (p.step === 'SEAL') return `Round ${p.round}: both sides write and seal.`;
  if (p.step === 'REVEAL') return `Round ${p.round}: both sealed, opening.`;
  if (p.step === 'CHECK') return `Round ${p.round}: both open, ready to check.`;
  return 'Same page. Waiting for both signatures.';
}

/**
 * Which terms a text seems to mention, worked out in the browser from words
 * alone. A hint for the writer, never the judge: validators read both texts.
 */
const HINTS: Record<Term, RegExp> = {
  amount: /\b\d[\d,.]*\s*(k\b|usdc|usdt|usd|eth|gen|dai|btc|sol|arb|op|\$|dollars?|tokens?)|\$\s*\d|\b(price|fee|rate|paid|pays?|budget)\b|\d+\s*(%|percent)/i,
  deliverable: /\b(posts?|threads?|tweets?|videos?|logos?|designs?|articles?|files?|pngs?|svgs?|pages?|sites?|website|landing|code|audit|report|deliver\w*|write|build|design|translate|spaces?)\b/i,
  deadline: /\b(by|before|until|due|deadline|within|no later than)\b.{0,24}(\d|mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|week|month|day|tomorrow|tonight)/i,
  payment: /\b(upfront|up front|in advance|after|on delivery|half|split|installments?|milestones?|escrow|net\s?\d+|paid (before|after|on|when|once)|pays? (before|after|on|when|once))\b/i,
  rights: /\b(owns?|ownership|rights?|license[sd]?|repost|quote|reuse|source files?|exclusive|copyright|credit)\b/i,
  cancellation: /\b(cancel\w*|back(s|ed)? out|refund\w*|kill fee|terminat\w*|walk(s|ed)? away|pull(s|ed)? out)\b/i,
};

export function mentions(text: string): Record<Term, boolean> {
  return Object.fromEntries(TERMS.map((t) => [t, HINTS[t].test(text)])) as Record<Term, boolean>;
}
