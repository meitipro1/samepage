# Samepage

**Two accounts of one deal, checked before anyone signs.** The two sides of a deal each write it down in their own
words, sealed so neither can copy the other. GenLayer validators compare the two accounts on six terms, amount,
deliverable, deadline, payment, rights and cancellation, and the deal is signed only when both describe the same thing,
with a good-faith deposit that stops either side from ghosting.

- **Live site:** https://usesamepage.vercel.app (docs at [/docs](https://usesamepage.vercel.app/docs))
- **Contract:** [`0x7c32684fC11c312685188C105D6F08c2B689b720`](https://explorer-studio-dev.genlayer.com/address/0x7c32684fC11c312685188C105D6F08c2B689b720)
  on GenLayer **Studio Next** (chain 61997), deployed in
  [`0x01c1460f…`](https://explorer-studio-dev.genlayer.com/tx/0x01c1460f82343e19817c2cedd5622913a21f2ab552f674d2a13b8d6c31b72b2e),
  source sha256 `fbc5e9ac…b28d43`, frozen in [`contracts/FROZEN.json`](contracts/FROZEN.json); `python scripts/verify.py`
  reads the deployed bytes back and finds them identical
- **Evaluation:** @@EVAL@@ ([`eval/results.md`](eval/results.md))
- **Offline suite:** @@TESTS@@ tests, and @@MUTANTS@@ mutants caught ([`docs/MUTATIONS.md`](docs/MUTATIONS.md))

## How it works

1. **Open.** One side opens a page with a title (at most 80 characters), the counterparty's address, one deposit that
   both sides pay (possibly zero) and a window of 6 to 96 hours for each step. The named counterparty joins with the same
   deposit.
2. **Seal.** Each side writes the deal in its own words (at most 1,200 characters, any language) and seals
   `sha256("text|salt|address")`. The address is inside the hash, so a seal copied from the other side can never be opened.
3. **Open.** Neither side can open before both have sealed, and an account that does not match its seal is refused.
4. **Check.** Anyone calls `check`: validators read the spec's prompt, word for word, and answer `MATCH`, `DIFFER` or
   `ABSENT` for each of six terms. Every node asks **in both orders** (each account first once); a term the two orders
   read differently is stored as `DIFFER`, so the uncertainty lands in the value, never in the comparison. Validators
   agree only when **all six statuses** are the leader's, exactly. The verdict is computed from the six statuses in code:
   `DIFFERENT` if any term differs, `GAPS` if amount, deliverable or deadline is absent from both, `SAME_PAGE` otherwise.
   The leader's one-line notes are stored as a reading aid; they are never compared and never signed.
5. **Sign.** On `SAME_PAGE` both sign, the page is `AGREED`, and both deposits are credited back. Otherwise both rewrite
   once; a round 2 that still differs closes `NOT_AGREED` with both deposits back, because disagreeing honestly is not
   ghosting. A side that misses a window to join, seal, open or sign loses its deposit to the other through `no_show`.
   `check`, `sign` and `no_show` only credit balances; `withdraw` is the only payout, a top-level transfer.

| Method | Kind | |
|---|---|---|
| `open_page(title, counterparty, deposit, window_hours)` | payable | Opens a page with the opener's deposit |
| `join(page_id)` | payable | The named counterparty joins with the same deposit |
| `seal(page_id, seal)` | write | Seals this round's account, once per side per round |
| `reveal(page_id, text, salt)` | write | Opens an account after both sealed, checked against its seal |
| `check(page_id)` | write, nondet | Compares the two accounts on six terms and sets the verdict |
| `sign(page_id)` | write | Signs a SAME PAGE record; both signatures make it AGREED |
| `no_show(page_id)` | write | After a missed window, moves the absent side's deposit to the other |
| `withdraw()` | write, pays | Top-level transfer of the caller's balance |
| `get_page(page_id)` | view | Title, sides, rounds, accounts once opened, statuses, notes, signatures |
| `list_pages(address, offset, limit)` | view | Pages an address opened or was named in, with its balance |

The full reference is generated from the source: [docs/reference/contract](https://usesamepage.vercel.app/docs/reference/contract).

## What is on chain

@@ONCHAIN@@

## Repository

```
contracts/samepage.py       the contract, judge prompt pinned inside; FROZEN.json records the deployment
tests/test_direct.py        every method and every rule, the judge mocked per node (tests/genvm_double.py)
tests/test_static.py        static checks over the parsed source: auth, fencing, money paths, storage rules
tests/vectors.json          sha256 vectors shared by the contract and the site
eval/                       golden cases, locked before the first run, and their results with transactions
scripts/                    deploy, verify the deployed bytes, mutate every defence, seed, generate the docs
web/                        Next.js site and Fumadocs docs; writes are signed in the visitor's wallet
submission/                 portal text, evidence links, 512 px icon
```

## Run it

```bash
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m pytest tests -q          # offline, no network
.venv/Scripts/python scripts/mutate.py           # break each defence, name the test that catches it
.venv/Scripts/python scripts/verify.py           # the deployed bytes against contracts/samepage.py
.venv/Scripts/python eval/run_golden.py --report # rewrite eval/results.md from eval/results.json
cd web && npm ci && npm run dev                  # the site on http://localhost:3210
node scripts/reviewer-path.mjs rp2               # the reviewer's path from fresh accounts, through the site's code
```

No private key is ever on a server or in this repository. Scripts keep test accounts in `~/.samepage/accounts.json` and
print only addresses; the site signs every write in the visitor's own wallet.

## Honest limits

Samepage checks that two accounts describe the same deal, not that the deal is fair, legal or kept. It holds no payment
and judges no delivery, and both accounts are public once opened, so it suits deals that can be public, such as
promotions, gigs and collaborations, not confidential ones. The model can be wrong; validators agree on its six labels,
asked in both orders, and both sides read both texts before signing, which is why the texts and the statuses are the
record, not the notes.
