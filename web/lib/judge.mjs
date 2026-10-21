import contract from './contract.generated.json' with { type: 'json' };

/**
 * The judge prompt the validators read, built here for the docs and the
 * "terms your text mentions" hint. The template is the contract's JUDGE
 * constant, written into contract.generated.json by scripts/gen_docs.py; fence
 * and flat are the contract's functions of the same names, line for line.
 * Plain JavaScript so tests/test_static.py can render a prompt with this exact
 * file and compare it with the contract's.
 */

export const JUDGE = contract.judge;
export const LIMITS = contract.limits;
export const TERMS = contract.terms;
export const REQUIRED = contract.required;

export function fence(raw) {
  return String(raw).replace(/</g, '(').replace(/>/g, ')');
}

/** Python's " ".join(text.split()): runs of whitespace as one space, ends trimmed. */
export function flat(text) {
  return String(text).split(/[\s\u001c-\u001f\u0085]+/u).filter(Boolean).join(' ');
}

export function judgePrompt(title, a, b) {
  const values = { title: fence(flat(title)), a: fence(a), b: fence(b) };
  return JUDGE.replace(/\{(title|a|b)\}/g, (_, key) => values[key]);
}

/** The contract's verdict_of and count_of, for drawing a stored result. */
export function verdictOf(statuses) {
  const list = TERMS.map((t) => statuses[t]);
  if (list.includes('DIFFER')) return { verdict: 'DIFFERENT', count: list.filter((s) => s === 'DIFFER').length };
  const gaps = REQUIRED.filter((t) => statuses[t] === 'ABSENT').length;
  return gaps ? { verdict: 'GAPS', count: gaps } : { verdict: 'SAME_PAGE', count: 0 };
}
