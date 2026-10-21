/**
 * Walk the reviewer's path on the live site from accounts that have never
 * touched the contract, through the site's own code: the faucet route of the
 * deployed site, lib/hash.mjs for the seals, and lib/genlayer-core.mjs for
 * every write (the file the browser runs), signed by a stand-in EIP-1193
 * wallet.
 *
 *   node scripts/reviewer-path.mjs [run name]     # run or resume
 *
 * faucet -> open a page -> refusals (a wrong deposit, an early open) -> join
 * -> both seal -> both open -> check (round 1 differs on payment) -> both
 * rewrite -> check (same page) -> both sign -> both withdraw -> finality ->
 * the balances are reconciled to the wei from every transaction's own fee
 * accounting. Every step is written to docs/reviewer-path.studio-next.json
 * before it is printed; keys never leave ~/.samepage/accounts.json.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { CONTRACT, EXPLORER, outcomeOf, readClient, submit, waitDecided, waitFinal, walletClient } from '../lib/genlayer-core.mjs';
import { sealOf } from '../lib/hash.mjs';
import { balanceOf, ensureAccount, rpc, standinWallet } from './standin-wallet.mjs';

const SITE = process.env.SAMEPAGE_SITE ?? 'https://usesamepage.vercel.app';
const run = process.argv[2] ?? 'rp1';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const RECORD = path.join(here, '..', '..', 'docs', 'reviewer-path.studio-next.json');
const GEN = 10n ** 18n;
const DEPOSIT = 10n * GEN;

const TITLE = 'Mira site banner set';
const TEXTS = {
  opener_r1:
    'Dana designs a banner set for the Mira site: 3 banners at 1500x500, delivered as PNG and the Figma source by Nov 6, 2026. Mira pays 250 USDC, all of it on delivery.',
  counterparty_r1:
    'I design 3 banners for Mira at 1500x500, PNG plus the Figma file, all delivered by November 6, 2026, for 250 USDC: half before I start, half on delivery.',
  opener_r2:
    'Dana designs a banner set for the Mira site: 3 banners at 1500x500, delivered as PNG and the Figma source by Nov 6, 2026. Mira pays 250 USDC, half before Dana starts and half on delivery.',
  counterparty_r2:
    'I design 3 banners for Mira at 1500x500, PNG plus the Figma file, all delivered by November 6, 2026, for 250 USDC: half before I start, the other half on delivery.',
};

const record = fs.existsSync(RECORD) ? JSON.parse(fs.readFileSync(RECORD, 'utf8')) : { runs: {} };
const log = (record.runs[run] ??= { site: SITE, contract: CONTRACT, started_at: new Date().toISOString(), accounts: {}, steps: [] });
const save = () => fs.writeFileSync(RECORD, JSON.stringify(record, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
log.salts ??= {};

const who = {};
for (const name of ['opener', 'counterparty']) {
  const address = ensureAccount(`${run}_${name}`);
  who[name] = { name: `${run}_${name}`, address };
  log.accounts[name] = address;
}
save();

const reader = readClient();
async function view(method, args) {
  for (let i = 1; ; i++) {
    try {
      return JSON.parse(String(await reader.readContract({ address: CONTRACT, functionName: method, args })));
    } catch (error) {
      if (i >= 6) throw error;
      await new Promise((r) => setTimeout(r, 4000 * i));
    }
  }
}

function done(key) {
  return log.steps.find((s) => s.key === key && (s.ok !== undefined || s.method === 'faucet'));
}

async function step(key, name, method, args, value = 0n, expectRefusal = false) {
  const found = done(key);
  if (found && (found.ok || expectRefusal)) return found;
  const { address, provider } = standinWallet(who[name].name);
  const client = walletClient(address, provider);
  const started = Date.now();
  const hash = await submit(client, { method, args, value, sender: address });
  const row = { key, method, from: address, hash, value: value.toString(), sent_at: new Date().toISOString() };
  log.steps.push(row);
  save();
  const outcome = outcomeOf(await waitDecided(client, hash, method));
  Object.assign(row, { ok: outcome.ok, status: outcome.status, returned: outcome.returned ?? null, refusal: outcome.refusal || null, expected: expectRefusal ? 'refusal' : 'success', seconds: Math.round((Date.now() - started) / 1000) });
  save();
  console.log(`  ${key}: ${method} ${outcome.ok ? 'ok -> ' + JSON.stringify(outcome.returned) : 'refused: ' + (outcome.refusal || outcome.status)}  (${row.seconds}s)\n    ${EXPLORER}/tx/${hash}`);
  if (outcome.ok === expectRefusal && method !== 'check') throw new Error(`${key}: expected ${expectRefusal ? 'a refusal' : 'success'}`);
  return row;
}

// 1. The faucet, through the deployed site's own route, with the address in lower case as a wallet reports it.
for (const name of Object.keys(who)) {
  const key = `faucet-${name}`;
  if (done(key)) continue;
  const response = await fetch(`${SITE}/api/faucet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: who[name].address.toLowerCase() }) });
  const body = await response.json();
  const read_after = (await balanceOf(who[name].address)).toString();
  log.steps.push({ key, method: 'faucet', http: response.status, before: body.before ?? null, after: body.after ?? null, read_after, error: body.error ?? null, at: new Date().toISOString() });
  save();
  console.log(`  ${key}: HTTP ${response.status} ${body.error ?? ''} balance ${Number(BigInt(read_after)) / 1e18} GEN`);
  if (!response.ok) throw new Error(`faucet for ${name} answered ${response.status}`);
}

// 2. Open a page naming the counterparty, with a 10 GEN deposit and the shortest window.
const opened = await step('open', 'opener', 'open_page', [TITLE, who.counterparty.address, DEPOSIT, 6n], DEPOSIT);
const pid = Number(opened.returned);
log.page_id = pid;
save();

// 3. Refusals a reviewer should see, then the join.
await step('join-wrong-deposit', 'counterparty', 'join', [pid], DEPOSIT - 1n, true);
await step('join', 'counterparty', 'join', [pid], DEPOSIT);

async function round(n) {
  for (const side of ['opener', 'counterparty']) {
    const key = `${side}_r${n}`;
    log.salts[key] ??= crypto.randomUUID();
    save();
    const seal = await sealOf(TEXTS[key], log.salts[key], who[side].address);
    await step(`seal-${key}`, side, 'seal', [pid, seal]);
    if (n === 1 && side === 'opener') await step('open-before-both-sealed', 'opener', 'reveal', [pid, TEXTS[key], log.salts[key]], 0n, true);
  }
  for (const side of ['opener', 'counterparty']) {
    const key = `${side}_r${n}`;
    await step(`reveal-${key}`, side, 'reveal', [pid, TEXTS[key], log.salts[key]]);
  }
  for (let i = 1; ; i++) {
    const page = await view('get_page', [pid]);
    if (page.rounds[n - 1].verdict) return page.rounds[n - 1];
    if (i > 3) throw new Error(`round ${n}: three checks without a verdict`);
    await step(`check-r${n}-${i}`, 'counterparty', 'check', [pid]);
  }
}

// 4. Round 1, written to differ on payment; round 2 once both have settled it.
const r1 = await round(1);
log.round1 = { verdict: r1.verdict, count: r1.count, statuses: r1.statuses, notes: r1.notes };
save();
console.log(`  round 1: ${r1.verdict} ${r1.count} ${JSON.stringify(r1.statuses)}`);
if (r1.verdict !== 'SAME_PAGE') {
  const r2 = await round(2);
  log.round2 = { verdict: r2.verdict, count: r2.count, statuses: r2.statuses, notes: r2.notes };
  save();
  console.log(`  round 2: ${r2.verdict} ${r2.count} ${JSON.stringify(r2.statuses)}`);
}

// 5. Sign if the page is on the same page, then both withdraw and wait for finality.
let page = await view('get_page', [pid]);
if (page.step === 'SIGN') {
  await step('sign-opener', 'opener', 'sign', [pid]);
  await step('sign-counterparty', 'counterparty', 'sign', [pid]);
}
page = await view('get_page', [pid]);
log.final_page = { status: page.status, opener_payout: page.opener_payout, counterparty_payout: page.counterparty_payout };
save();
for (const name of Object.keys(who)) {
  const account = await view('list_pages', [who[name].address.toLowerCase(), 0, 1]);
  const key = `withdraw-${name}`;
  if (BigInt(account.balance) === 0n && !done(key)) {
    log.steps.push({ key, method: 'withdraw', skipped: 'nothing credited', at: new Date().toISOString() });
    save();
    continue;
  }
  const row = await step(key, name, 'withdraw', []);
  if (row.ok && !row.final_status) {
    const { address, provider } = standinWallet(who[name].name);
    row.final_status = outcomeOf(await waitFinal(walletClient(address, provider), row.hash)).status;
    row.paid_by_contract = String(row.returned);
    save();
  }
}

// 6. Reconcile every account over the whole run, once everything has settled.
await new Promise((r) => setTimeout(r, 90000));
const out = {};
for (const name of Object.keys(who)) {
  const address = who[name].address;
  let expected = BigInt(done(`faucet-${name}`).read_after);
  const rows = [];
  for (const s of log.steps.filter((x) => x.hash && x.from === address)) {
    const tx = await rpc('eth_getTransactionByHash', [s.hash]);
    const acct = tx?.data?.fee_accounting ?? {};
    const net = (acct.top_ups ?? []).reduce((a, t) => a + BigInt(t.primaryAmount ?? 0), 0n) - (acct.refunds ?? []).reduce((a, r) => a + BigInt(r.primary ?? 0), 0n);
    // A refused write is rolled back with its value: only a write that returned kept what it carried.
    const value = s.ok ? BigInt(s.value ?? 0) : 0n;
    expected -= value + net;
    if (s.method === 'withdraw' && s.ok) expected += BigInt(s.returned);
    rows.push({ key: s.key, value: value.toString(), fee_net: net.toString(), fee_status: acct.status ?? null });
  }
  const now = await balanceOf(address);
  out[name] = { address, expected: expected.toString(), balance: now.toString(), difference: (now - expected).toString(), transactions: rows };
  console.log(`  ${name}: expected ${Number(expected) / 1e18} GEN, balance ${Number(now) / 1e18} GEN, difference ${now - expected} wei`);
}
log.reconciliation = { at: new Date().toISOString(), accounts: out };
log.finished_at = new Date().toISOString();
save();
console.log(`done: page ${pid}, ${SITE}/p/${pid}`);
