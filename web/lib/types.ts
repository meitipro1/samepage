/** The shapes the contract's views return (contracts/samepage.py _page_json and _round_json). */

export type Term = 'amount' | 'deliverable' | 'deadline' | 'payment' | 'rights' | 'cancellation';
export type Status = 'MATCH' | 'DIFFER' | 'ABSENT';
export type Verdict = 'SAME_PAGE' | 'DIFFERENT' | 'GAPS';
export type PageStatus = 'OPEN' | 'AGREED' | 'NOT_AGREED' | 'NO_SHOW';
export type Step = 'JOIN' | 'SEAL' | 'REVEAL' | 'CHECK' | 'SIGN' | 'DONE';

export type Round = {
  number: number;
  opener_seal: string;
  opener_sealed_at: number;
  counterparty_seal: string;
  counterparty_sealed_at: number;
  opener_text: string;
  opener_salt: string;
  opener_opened_at: number;
  counterparty_text: string;
  counterparty_salt: string;
  counterparty_opened_at: number;
  statuses: Partial<Record<Term, Status>>;
  notes: Partial<Record<Term, string>>;
  verdict: Verdict | '';
  count: number;
  checked_at: number;
  checked_by: string;
};

export type Page = {
  id: number;
  opener: string;
  counterparty: string;
  title: string;
  deposit: string;
  window_hours: number;
  opened_at: number;
  joined_at: number;
  status: PageStatus;
  step: Step;
  step_at: number;
  step_end: number;
  round: number;
  opener_signed_at: number;
  counterparty_signed_at: number;
  absent: string[];
  opener_payout: string;
  counterparty_payout: string;
  closed_at: number;
  closed_by: string;
};

export type PageFull = Page & { found: true; rounds: Round[] };
export type NotFound = { found: false };
export type PageItem = Page & { last_verdict: Verdict | ''; last_count: number };
export type PageList = { address: string; balance: string; withdrawn: string; total: number; offset: number; items: PageItem[] };
