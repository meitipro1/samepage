#!/usr/bin/env python3
"""
Run the golden cases through the deployed Samepage contract on Studio Next,
through real consensus, and publish what came out.

    python eval/run_golden.py            # the golden cases, then the held-out ones once
    python eval/run_golden.py --report   # rewrite results.md from results.json

eval/golden.json was written, hashed and timestamped (eval/golden.lock.json)
before the first run, and this script refuses to run if it has changed since.

Each case is one page of its own, opened by the "golden_a" account naming
"golden_b", with no deposit and the shortest window, 6 hours. Both accounts
seal their account with a fresh salt, open it, and one check transaction has
every validator ask the judge in both orders and agree on the six statuses.
The statuses are read back from the contract with get_page, never from the
script's memory. Every step is saved before anything is printed, and the run
resumes where it stopped.

A check whose round produced no decision is recorded as such and, for golden
cases, sent again; every attempt stays in the record. A held-out case is
checked once.
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import sys
import uuid

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "scripts"))

import chain as C  # noqa: E402

# A model's note can carry any character; the Windows console codepage cannot.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = pathlib.Path(__file__).resolve().parent
GOLDEN = HERE / "golden.json"
LOCK = HERE / "golden.lock.json"
RESULTS = HERE / "results.json"
REPORT = HERE / "results.md"
SIDES = ("golden_a", "golden_b")
WINDOW = 6
TERMS = ("amount", "deliverable", "deadline", "payment", "rights", "cancellation")
GOLDEN_TRIES = 3


def load_results() -> dict:
    if RESULTS.exists():
        return json.loads(RESULTS.read_text(encoding="utf-8"))
    return {"cases": {}, "attempts": []}


def save(results: dict) -> None:
    RESULTS.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def must(outcome: dict, what: str) -> dict:
    if not outcome["ok"]:
        raise SystemExit(f"{what} failed: {outcome['detail']}  {C.EXPLORER}/tx/{outcome['hash']}")
    return outcome


def locked() -> dict:
    lock = json.loads(LOCK.read_text(encoding="utf-8"))
    digest = hashlib.sha256(GOLDEN.read_bytes()).hexdigest()
    if digest != lock["sha256"]:
        raise SystemExit(f"eval/golden.json changed since it was locked ({digest} != {lock['sha256']}); refusing to run")
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


def run_case(case: dict, results: dict, chains: dict, address: str) -> None:
    a, b = chains["golden_a"], chains["golden_b"]
    row = results["cases"].setdefault(case["id"], {})
    if "page_id" not in row:
        out = must(a.send(address, "open_page", [case["title"], b.account.address, 0, WINDOW]), "open_page")
        row.update({"page_id": int(out["result"]), "open_tx": out["hash"]})
        save(results)
        print(f"case {case['id']}: page {row['page_id']}  {out['hash']}")
    pid = row["page_id"]
    page = a.read_json(address, "get_page", [pid])
    if page["step"] == "JOIN":
        row["join_tx"] = must(b.send(address, "join", [pid]), "join")["hash"]
        save(results)
        page = a.read_json(address, "get_page", [pid])
    for name, chain, text in (("a", a, case["a"]), ("b", b, case["b"])):
        key = f"{name}_salt"
        if key not in row:
            row[key] = str(uuid.uuid4())
            save(results)
        side = "opener" if name == "a" else "counterparty"
        current = a.read_json(address, "get_page", [pid])["rounds"][0]
        if current[f"{side}_seal"] == "":
            digest = hashlib.sha256(f"{text}|{row[key]}|{chain.account.address.lower()}".encode("utf-8")).hexdigest()
            row[f"{name}_seal_tx"] = must(chain.send(address, "seal", [pid, digest]), "seal")["hash"]
            save(results)
    for name, chain, text in (("a", a, case["a"]), ("b", b, case["b"])):
        side = "opener" if name == "a" else "counterparty"
        current = a.read_json(address, "get_page", [pid])["rounds"][0]
        if current[f"{side}_opened_at"] == 0:
            row[f"{name}_reveal_tx"] = must(chain.send(address, "reveal", [pid, text, row[f"{name}_salt"]]), "reveal")["hash"]
            save(results)
    tries = 1 if case.get("held_out") else GOLDEN_TRIES
    for attempt in range(1, tries + 1):
        page = a.read_json(address, "get_page", [pid])
        if page["rounds"][0]["verdict"]:
            break
        if sum(1 for x in results["attempts"] if x["case"] == case["id"]) >= tries:
            break
        out = a.send(address, "check", [pid])
        number = sum(1 for x in results["attempts"] if x["case"] == case["id"]) + 1
        results["attempts"].append(
            {"case": case["id"], "attempt": number, "tx": out["hash"], "ok": out["ok"], "returned": out.get("result"), "detail": out.get("detail", "")}
        )
        if out["ok"]:
            row["check_tx"] = out["hash"]
        save(results)
        print(f"case {case['id']}: check attempt {number} -> {out.get('result') if out['ok'] else out.get('detail')}  {out['hash']}")
    page = a.read_json(address, "get_page", [pid])
    r = page["rounds"][0]
    if r["verdict"]:
        row.update({"statuses": r["statuses"], "verdict": r["verdict"], "count": r["count"], "notes": r["notes"], "checked_by": r["checked_by"]})
        save(results)
        print(f"case {case['id']}: {r['verdict']} {r['count']}  " + " ".join(f"{t}={r['statuses'][t]}" for t in TERMS))


def report(golden: dict, results: dict) -> None:
    lines = ["# Golden results", "", f"Contract `{results.get('contract', '')}` on Studio Next (chain 61997).", ""]
    lines += ["| Case | Expected | Got | Statuses (amount, deliverable, deadline, payment, rights, cancellation) | All six | Check tx |", "|---|---|---|---|---|---|"]
    hits = run = 0
    for c in golden["cases"]:
        row = results["cases"].get(c["id"], {})
        got = f"{row['verdict']} {row['count']}" if row.get("verdict") else "not run"
        statuses = " ".join(row["statuses"][t] for t in TERMS) if row.get("statuses") else ""
        if c.get("held_out"):
            expected, mark = "EITHER (held out)", ""
        else:
            expected = f"{c['verdict']} {c['count']}"
            if row.get("statuses"):
                run += 1
                same = all(row["statuses"][t] == c["statuses"][t] for t in TERMS)
                hits += same
                mark = "yes" if same else "no: " + ", ".join(t for t in TERMS if row["statuses"][t] != c["statuses"][t])
            else:
                mark = ""
        tx = row.get("check_tx", "")
        lines.append(f"| {c['id']} | {expected} | {got} | {statuses} | {mark} | {f'[{tx[:10]}]({C.EXPLORER}/tx/{tx})' if tx else ''} |")
    lines += ["", f"Golden cases matching on all six statuses: **{hits} of {run}**.", "", "## Every check attempt", ""]
    for x in results["attempts"]:
        lines.append(f"- case {x['case']} attempt {x['attempt']}: {'`' + str(x['returned']) + '`' if x['ok'] else 'no decision: ' + str(x['detail'])[:160]} ([tx]({C.EXPLORER}/tx/{x['tx']}))")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {REPORT.relative_to(C.ROOT).as_posix()}: {hits} of {run} on all six")


def main() -> int:
    golden = locked()
    results = load_results()
    if "--report" in sys.argv:
        report(golden, results)
        return 0
    address = C.address()
    results["contract"] = address
    results["explorer"] = C.EXPLORER
    save(results)
    accounts = C.accounts(*SIDES)
    chains = {name: C.Chain(acc) for name, acc in accounts.items()}
    for name, chain in chains.items():
        chain.ensure(chain.account.address, minimum_gen=20, top_up_gen=200)
        print(f"{name} {chain.account.address}")
    for case in [c for c in golden["cases"] if not c.get("held_out")] + [c for c in golden["cases"] if c.get("held_out")]:
        run_case(case, results, chains, address)
    report(golden, results)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
