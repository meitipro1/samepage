#!/usr/bin/env python3
"""
Seed the deployed contract with real pages, both paths, every step on chain.

    python scripts/seed.py noshow-start   # page A: Kiln seals, Sera never does (needs the 6 hour window to pass)
    python scripts/seed.py story          # page B: the spec's story, DIFFERENT in round 1, SAME PAGE in round 2, both sign
    python scripts/seed.py refusals       # the contract refusing: a copied seal, an early open, a stranger, a wrong deposit
    python scripts/seed.py open           # page C: left on its seal step, so anyone can see a live page
    python scripts/seed.py noshow-finish  # after the window: no_show moves Sera's deposit to Kiln, then both withdraw

Accounts are "seed_kiln" and "seed_sera" in ~/.samepage/accounts.json, plus a
"seed_stranger" who never takes a side. Every step is written to
docs/seed.studio-next.json before it is printed, and appended to
docs/seed.studio-next.log. The text and salt behind each seal stay in
~/.samepage/seed-tickets.json: they become public on chain the moment an
account is opened, and an account not yet opened stays sealed.

The accounts are written as real deals with real terms, worded differently on
each side, because content-free accounts make honest validators disagree.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import sys
import uuid

import chain as C

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RECORD = C.ROOT / "docs" / "seed.studio-next.json"
#: Texts and salts of seals, kept on this machine: an account not yet opened must not be readable before the other side seals.
SECRETS = C.KEYS.parent / "seed-tickets.json"
LOG = C.ROOT / "docs" / "seed.studio-next.log"
DEPOSIT = 20 * C.GEN
SMALL = 5 * C.GEN
WINDOW = 6

STORY_TITLE = "Kiln launch posts"
KILN_1 = "Sera writes 3 posts and a thread on X about the Kiln launch, all live by Oct 24, 2026. Kiln pays 600 USDC, all of it after the last post is live."
SERA_1 = "I post 3 times on X about Kiln's launch, all live by Oct 24, 2026, for 600 USDC, half before I start and half after the last post."
KILN_2 = "Sera writes 3 posts and one thread on X about the Kiln launch, all live by Oct 24, 2026. Kiln pays 600 USDC, half before Sera starts and half after the thread is live. Kiln may repost and quote the posts."
SERA_2 = "I write 3 posts and a thread on X about Kiln's launch, everything live by October 24, 2026. 600 USDC: half before I start, the other half once the thread is live. Kiln can repost and quote them."

NOSHOW_TITLE = "Kiln logo, PNG and SVG"
NOSHOW_KILN = "Sera designs a logo for Kiln and delivers PNG and SVG files by Oct 30, 2026. Kiln pays 300 USDC when the files arrive."

OPEN_TITLE = "Kiln ambassador, November"
OPEN_KILN = "Sera is a Kiln ambassador for November 2026: 4 posts and 1 Space on X. Kiln pays 400 USDC on Dec 1, 2026."
OPEN_SERA = "I am Kiln's ambassador for November 2026, with 4 posts and 1 Space on X, for 400 USDC paid on Nov 1, 2026, at the start of the month."
OPEN_KILN_2 = "Sera is a Kiln ambassador for November 2026: 4 posts and 1 Space on X. Kiln pays 400 USDC, half on Nov 1 and half on Dec 1, 2026."


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load() -> dict:
    if RECORD.exists():
        return json.loads(RECORD.read_text(encoding="utf-8"))
    return {"contract": C.address(), "explorer": C.EXPLORER, "pages": {}, "steps": []}


def save(record: dict) -> None:
    RECORD.parent.mkdir(parents=True, exist_ok=True)
    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def step(record: dict, what: str, outcome: dict, expect_ok: bool = True) -> dict:
    entry = {
        "at": now_iso(),
        "what": what,
        "method": outcome.get("method"),
        "tx": outcome.get("hash"),
        "ok": outcome["ok"],
        "returned": outcome.get("result"),
        "refusal": outcome.get("refusal", ""),
        "detail": outcome.get("detail", ""),
    }
    record["steps"].append(entry)
    save(record)
    line = f"{entry['at']} {what}: {'ok ' + json.dumps(entry['returned'], ensure_ascii=False) if entry['ok'] else 'refused ' + (entry['refusal'] or entry['detail'])}  {C.EXPLORER}/tx/{entry['tx']}"
    with LOG.open("a", encoding="utf-8", newline="\n") as log:
        log.write(line + "\n")
    print(line)
    if entry["ok"] != expect_ok:
        raise SystemExit(f"{what}: expected {'success' if expect_ok else 'a refusal'}, got the other")
    return entry


def seal_hex(text: str, salt: str, address: str) -> str:
    return hashlib.sha256(f"{text}|{salt}|{address.lower()}".encode("utf-8")).hexdigest()


def setup():
    accounts = C.accounts("seed_kiln", "seed_sera", "seed_stranger")
    chains = {name: C.Chain(acc) for name, acc in accounts.items()}
    for chain in chains.values():
        chain.ensure(chain.account.address, minimum_gen=60, top_up_gen=200)
    return chains


def open_page(record, key, chains, title, deposit):
    kiln, sera = chains["seed_kiln"], chains["seed_sera"]
    if key in record["pages"]:
        return record["pages"][key]
    out = step(record, f"{key}: Kiln opens \"{title}\" naming Sera", kiln.send(C.address(), "open_page", [title, sera.account.address, deposit, WINDOW], value=deposit))
    page = {"id": int(out["returned"]), "title": title, "deposit": str(deposit)}
    record["pages"][key] = page
    save(record)
    return page


def secrets() -> dict:
    return json.loads(SECRETS.read_text(encoding="utf-8")) if SECRETS.exists() else {}


def keep(key: str, text: str, salt: str) -> None:
    held = secrets()
    held[key] = {"text": text, "salt": salt}
    SECRETS.write_text(json.dumps(held, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def seal(record, page, who, chain, text, label):
    salt = str(uuid.uuid4())
    keep(f"{page['id']}:{label}", text, salt)
    step(record, f"page {page['id']}: {label} seals", chain.send(C.address(), "seal", [page["id"], seal_hex(text, salt, chain.account.address)]))


def reveal(record, page, chain, label):
    held = secrets()[f"{page['id']}:{label}"]
    step(record, f"page {page['id']}: {label} opens", chain.send(C.address(), "reveal", [page["id"], held["text"], held["salt"]]))


def noshow_start(chains, record):
    page = open_page(record, "noshow", chains, NOSHOW_TITLE, SMALL)
    step(record, f"page {page['id']}: Sera joins with the deposit", chains["seed_sera"].send(C.address(), "join", [page["id"]], value=SMALL))
    seal(record, page, "kiln", chains["seed_kiln"], NOSHOW_KILN, "kiln")
    print(f"page {page['id']} now waits on Sera's seal. After the 6 hour window: python scripts/seed.py noshow-finish")


#: Pages closed by no_show once their windows lapse: page A (Sera never sealed), the refusals page (Sera sealed a
#: copy of Kiln's seal and so could never open it), and golden case H2's page, whose check never reached a verdict.
LAPSING = [("noshow", "the seal window closed with Sera's seal missing"), ("refusals", "the opening window closed with Sera's copied seal unopened")]
H2_PAGE = 12


def noshow_finish(chains, record):
    import time

    stranger = chains["seed_stranger"]
    targets = [(record["pages"][key]["id"], why) for key, why in LAPSING] + [(H2_PAGE, "the check window closed with no verdict on golden case H2")]
    for pid, why in targets:
        page = stranger.read_json(C.address(), "get_page", [pid])
        if page["status"] != "OPEN":
            print(f"page {pid} is already {page['status']}")
            continue
        wait = int(page["step_end"]) + 90 - int(time.time())
        if wait > 0:
            print(f"page {pid}: waiting {wait // 60} min for its {page['step']} window to close")
            time.sleep(wait)
        step(record, f"page {pid}: a stranger calls no_show, {why}", stranger.send(C.address(), "no_show", [pid]))
        after = stranger.read_json(C.address(), "get_page", [pid])
        print(f"page {pid}: {after['status']}, absent {after['absent']}, opener {int(after['opener_payout']) / C.GEN:g} GEN, counterparty {int(after['counterparty_payout']) / C.GEN:g} GEN")


def story(chains, record):
    kiln, sera = chains["seed_kiln"], chains["seed_sera"]
    page = open_page(record, "story", chains, STORY_TITLE, DEPOSIT)
    pid = page["id"]
    step(record, f"page {pid}: Sera joins with the 20 GEN deposit", sera.send(C.address(), "join", [pid], value=DEPOSIT))
    seal(record, page, "kiln", kiln, KILN_1, "kiln_r1")
    seal(record, page, "sera", sera, SERA_1, "sera_r1")
    reveal(record, page, kiln, "kiln_r1")
    reveal(record, page, sera, "sera_r1")
    for attempt in range(3):
        out = kiln.send(C.address(), "check", [pid])
        step(record, f"page {pid}: round 1 check, attempt {attempt + 1}", out, expect_ok=out["ok"])
        if out["ok"]:
            break
    seal(record, page, "kiln", kiln, KILN_2, "kiln_r2")
    seal(record, page, "sera", sera, SERA_2, "sera_r2")
    reveal(record, page, kiln, "kiln_r2")
    reveal(record, page, sera, "sera_r2")
    for attempt in range(3):
        out = sera.send(C.address(), "check", [pid])
        step(record, f"page {pid}: round 2 check, attempt {attempt + 1}", out, expect_ok=out["ok"])
        if out["ok"]:
            break
    state = kiln.read_json(C.address(), "get_page", [pid])
    print(f"page {pid}: step {state['step']}, verdicts {[r['verdict'] for r in state['rounds']]}")
    if state["step"] == "SIGN":
        step(record, f"page {pid}: Kiln signs", kiln.send(C.address(), "sign", [pid]))
        step(record, f"page {pid}: Sera signs", sera.send(C.address(), "sign", [pid]))


def refusals(chains, record):
    kiln, sera, stranger = chains["seed_kiln"], chains["seed_sera"], chains["seed_stranger"]
    page = open_page(record, "refusals", chains, "Kiln thread, refusals on record", SMALL)
    pid = page["id"]
    step(record, f"page {pid}: a stranger tries to join", stranger.send(C.address(), "join", [pid], value=SMALL), expect_ok=False)
    step(record, f"page {pid}: Sera joins with the wrong deposit", sera.send(C.address(), "join", [pid], value=SMALL - 1), expect_ok=False)
    step(record, f"page {pid}: Sera joins", sera.send(C.address(), "join", [pid], value=SMALL))
    text = "Sera writes one thread on X about the Kiln launch by Oct 28, 2026, for 150 USDC paid after it is live."
    seal(record, page, "kiln", kiln, text, "kiln")
    salt = secrets()[f"{pid}:kiln"]["salt"]
    copied = seal_hex(text, salt, kiln.account.address)
    step(record, f"page {pid}: Kiln tries to open before Sera has sealed", kiln.send(C.address(), "reveal", [pid, text, salt]), expect_ok=False)
    step(record, f"page {pid}: Sera seals a copy of Kiln's seal", sera.send(C.address(), "seal", [pid, copied]))
    step(record, f"page {pid}: Sera tries to open Kiln's text with Kiln's salt", sera.send(C.address(), "reveal", [pid, text, salt]), expect_ok=False)
    reveal(record, page, kiln, "kiln")
    step(record, f"page {pid}: a stranger tries to sign", stranger.send(C.address(), "sign", [pid]), expect_ok=False)
    step(record, f"page {pid}: a stranger tries no_show before the window closes", stranger.send(C.address(), "no_show", [pid]), expect_ok=False)
    step(record, f"page {pid}: a stranger tries to withdraw", stranger.send(C.address(), "withdraw", []), expect_ok=False)


def open_one(chains, record):
    """Page C: round 1 differs on when Kiln pays, and the page is left in round 2 with Kiln's new account sealed."""
    kiln, sera = chains["seed_kiln"], chains["seed_sera"]
    page = open_page(record, "open", chains, OPEN_TITLE, DEPOSIT)
    pid = page["id"]
    step(record, f"page {pid}: Sera joins", sera.send(C.address(), "join", [pid], value=DEPOSIT))
    seal(record, page, "kiln", kiln, OPEN_KILN, "kiln_r1")
    seal(record, page, "sera", sera, OPEN_SERA, "sera_r1")
    reveal(record, page, kiln, "kiln_r1")
    reveal(record, page, sera, "sera_r1")
    for attempt in range(3):
        out = sera.send(C.address(), "check", [pid])
        step(record, f"page {pid}: round 1 check, attempt {attempt + 1}", out, expect_ok=out["ok"])
        if out["ok"]:
            break
    state = kiln.read_json(C.address(), "get_page", [pid])
    if state["step"] == "SEAL" and state["round"] == 2:
        seal(record, page, "kiln", kiln, OPEN_KILN_2, "kiln_r2")


def withdraw_all(chains, record):
    for name in ("seed_kiln", "seed_sera"):
        chain = chains[name]
        due = int(chain.read_json(C.address(), "list_pages", [chain.account.address, 0, 1])["balance"])
        if due > 0:
            before = chain.balance(chain.account.address)
            out = step(record, f"{name} withdraws {due / C.GEN:g} GEN", chain.send(C.address(), "withdraw", [], until="finalized"))
            after = chain.balance(chain.account.address)
            record.setdefault("withdrawals", []).append({"who": name, "address": chain.account.address, "due": str(due), "before": str(before), "after": str(after), "tx": out["tx"]})
            save(record)
            print(f"  {name} balance {before / C.GEN:.6f} -> {after / C.GEN:.6f} GEN")


def main() -> int:
    stage = sys.argv[1] if len(sys.argv) > 1 else ""
    stages = {
        "noshow-start": noshow_start,
        "noshow-finish": noshow_finish,
        "story": story,
        "refusals": refusals,
        "open": open_one,
        "withdraw": withdraw_all,
    }
    if stage not in stages:
        raise SystemExit("stage is one of: " + ", ".join(stages))
    record = load()
    chains = setup()
    stages[stage](chains, record)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
