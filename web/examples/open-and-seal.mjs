/**
 * Open a page, join it, and seal and open both accounts, with genlayer-js and
 * the site's own seal function. Two local test accounts sign through
 * stand-in wallets (scripts/standin-wallet.mjs); a browser wallet works the
 * same way.
 *
 *   node examples/open-and-seal.mjs <opener account> <counterparty account>
 */
import crypto from 'node:crypto';

import { parseEther } from 'viem';

import { CONTRACT, outcomeOf, submit, waitDecided, walletClient } from '../lib/genlayer-core.mjs';
import { sealOf } from '../lib/hash.mjs';
import { ensureAccount, standinWallet } from '../scripts/standin-wallet.mjs';

const [openerName = 'example_opener', counterpartyName = 'example_counterparty'] = process.argv.slice(2);
ensureAccount(openerName);
ensureAccount(counterpartyName);
const opener = standinWallet(openerName);
const counterparty = standinWallet(counterpartyName);

async function send(wallet, method, args, value = 0n) {
  const client = walletClient(wallet.address, wallet.provider);
  const hash = await submit(client, { method, args, value, sender: wallet.address });
  const outcome = outcomeOf(await waitDecided(client, hash, method));
  if (!outcome.ok) throw new Error(`${method} refused: ${outcome.refusal}`);
  console.log(`${method} -> ${JSON.stringify(outcome.returned)}  ${hash}`);
  return outcome.returned;
}

// 1. Open a page naming the counterparty, with a 20 GEN deposit and 48 hours per step.
const deposit = parseEther('20');
const pageId = Number(await send(opener, 'open_page', ['Kiln launch posts', counterparty.address, deposit, 48n], deposit));

// 2. The counterparty joins with the same deposit.
await send(counterparty, 'join', [pageId], deposit);

// 3. Each side seals sha256("text|salt|address"). Keep the text and salt: they open the seal.
const accounts = {
  opener: 'Sera writes 3 posts on X about the Kiln launch, all live by Oct 24, 2026. Kiln pays 600 USDC after the last post.',
  counterparty: 'I post three times on X about Kiln’s launch by October 24, 2026, for 600 USDC, paid once the last post is live.',
};
const salts = { opener: crypto.randomUUID(), counterparty: crypto.randomUUID() };
await send(opener, 'seal', [pageId, await sealOf(accounts.opener, salts.opener, opener.address)]);
await send(counterparty, 'seal', [pageId, await sealOf(accounts.counterparty, salts.counterparty, counterparty.address)]);

// 4. Once both have sealed, each opens its account; the contract checks it against the seal.
await send(opener, 'reveal', [pageId, accounts.opener, salts.opener]);
await send(counterparty, 'reveal', [pageId, accounts.counterparty, salts.counterparty]);

// 5. Anyone may check: validators compare the two accounts on six terms.
console.log(`page ${pageId} is ready to check on ${CONTRACT}`);
