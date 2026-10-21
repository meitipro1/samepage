"""
The mutants scripts/mutate.py runs: one defence of contracts/samepage.py broken each.

(what the mutant does, text in the contract, what replaces it). Each text must
occur exactly once, so a mutant always changes exactly one place.
"""

MUTANTS = [
    # who may write
    ("join: anyone joins", "        if gl.message.sender_address != pg.counterparty:\n", "        if False:\n"),
    ("join: addresses compared as text", "if gl.message.sender_address != pg.counterparty:", "if gl.message.sender_address.as_hex != pg.counterparty.as_hex:"),
    ("side: a stranger acts as the counterparty", '        if who == pg.counterparty:\n            return "counterparty"\n        raise', '        if True:\n            return "counterparty"\n        raise'),
    ("side: the counterparty acts as the opener", "        if who == pg.opener:\n", "        if who == pg.opener or who == pg.counterparty:\n"),
    ("open: the opener names themself", "        if other == me:\n", "        if False:\n"),
    ("open: the zero address as counterparty", "        if other == ZERO:\n", "        if False:\n"),
    ("open: the page is recorded as nobody's", "            opener=me,\n", "            opener=ZERO,\n"),
    ("check: the caller is not recorded", "        r.checked_by = gl.message.sender_address\n", ""),
    ("close: the caller is not recorded", "        pg.closed_by = by\n", ""),
    ("withdraw: pays a fixed address", "_Payee(me).emit_transfer(value=u256(due))", "_Payee(ZERO).emit_transfer(value=u256(due))"),
    ("withdraw: the balance is not zeroed", "        self.balances[key] = u256(0)\n", ""),
    ("withdraw: pays with nothing due", "        if due <= 0:\n            raise", "        if due < 0:\n            raise"),
    # money in
    ("open: any value with the page", '        if int(gl.message.value) != int(deposit):\n            raise gl.vm.UserError(E + "send exactly the deposit with the page', '        if False:\n            raise gl.vm.UserError(E + "send exactly the deposit with the page'),
    ("join: any deposit", '        if int(gl.message.value) != int(pg.deposit):\n            raise gl.vm.UserError(E + "send exactly the deposit, "', '        if int(gl.message.value) < 0:\n            raise gl.vm.UserError(E + "send exactly the deposit, "'),
    ("join: a deposit above the page's", '        if int(gl.message.value) != int(pg.deposit):\n            raise gl.vm.UserError(E + "send exactly the deposit, "', '        if int(gl.message.value) < int(pg.deposit):\n            raise gl.vm.UserError(E + "send exactly the deposit, "'),
    ("open: a negative deposit", "        if deposit < 0:\n", "        if deposit < -1:\n"),
    ("open: a five-hour window", "MIN_WINDOW = 6", "MIN_WINDOW = 5"),
    ("open: a 97-hour window", "MAX_WINDOW = 96", "MAX_WINDOW = 97"),
    ("open: the title is unbounded", "MAX_TITLE = 80", "MAX_TITLE = 800"),
    ("open: an empty title", '        if name == "":\n            raise gl.vm.UserError(E + "the title is empty")', '        if False:\n            raise gl.vm.UserError(E + "the title is empty")'),
    ("open: a malformed counterparty", "        if len(raw) != 42 or not raw.lower().startswith(\"0x\") or any(ch not in HEX for ch in raw[2:].lower()):", "        if len(raw) != 42:"),
    # steps and windows
    ("windows: a step never closes", '        if now >= int(pg.step_end):\n            raise gl.vm.UserError(E + "the window for this step has closed', '        if False:\n            raise gl.vm.UserError(E + "the window for this step has closed'),
    ("windows: a closed page takes writes", '        if pg.status != OPEN:\n            raise gl.vm.UserError(E + "this page is closed, " + pg.status)\n        if pg.step != step:', '        if False:\n            raise gl.vm.UserError(E + "this page is closed, " + pg.status)\n        if pg.step != step:'),
    ("windows: any step takes any write", '        if pg.step != step:\n            raise', '        if False:\n            raise'),
    ("windows: the window is not restarted per step", "        pg.step_end = u64(now + int(pg.window) * HOUR)\n", ""),
    ("seal: twice by the opener", '            if r.opener_seal != "":\n                raise', '            if False:\n                raise'),
    ("seal: twice by the counterparty", '            if r.counterparty_seal != "":\n                raise', '            if False:\n                raise'),
    ("seal: opening starts after one seal", '        if r.opener_seal != "" and r.counterparty_seal != "":\n            self._step(pg, REVEAL, now)', '        if r.opener_seal != "" or r.counterparty_seal != "":\n            self._step(pg, REVEAL, now)'),
    ("seal: any text passes as a seal", "    if len(text) != 64 or any(ch not in HEX for ch in text):", "    if False:"),
    # opening
    ("reveal: the seal is not checked", "        if seal_of(body, key, me.as_hex) != sealed:", "        if False:"),
    ("reveal: checked against the other side's seal", "        sealed = r.opener_seal if side == \"opener\" else r.counterparty_seal", "        sealed = r.counterparty_seal if side == \"opener\" else r.opener_seal"),
    ("reveal: opened twice", "        if int(opened_at) > 0:\n", "        if False:\n"),
    ("reveal: an empty account", '        if body.strip() == "":\n            raise gl.vm.UserError(E + "the account is empty")', '        if False:\n            raise gl.vm.UserError(E + "the account is empty")'),
    ("reveal: an account of any length", "MAX_ACCOUNT = 1200", "MAX_ACCOUNT = 12000"),
    ("reveal: checking starts after one open", "        if r.opener_opened_at > 0 and r.counterparty_opened_at > 0:", "        if r.opener_opened_at > 0 or r.counterparty_opened_at > 0:"),
    ("salt: a bar in the salt", 'SALT_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-")', 'SALT_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-|")'),
    ("salt: any length", "    if len(text) < MIN_SALT or len(text) > MAX_SALT or any(ch not in SALT_CHARS for ch in text):", "    if any(ch not in SALT_CHARS for ch in text):"),
    ("seal: the address is not hashed", "(text + BAR + salt + BAR + address.lower())", "(text + BAR + salt)"),
    ("seal: the address keeps its case", "(text + BAR + salt + BAR + address.lower())", "(text + BAR + salt + BAR + address)"),
    ("seal: the bar is dropped between fields", "(text + BAR + salt + BAR + address.lower())", "(text + salt + BAR + address.lower())"),
    # the judge
    ("fence: the delimiters pass through", 'return str(raw).replace("<", "(").replace(">", ")")', "return str(raw)"),
    ("fence: deletes instead of replacing", 'return str(raw).replace("<", "(").replace(">", ")")', 'return str(raw).replace("<", "").replace(">", "")'),
    ("prompt: the title is not fenced", "title=fence(flat(title))", "title=flat(title)"),
    ("prompt: account B is not fenced", "b=fence(b))", "b=b)"),
    ("prompt: the title keeps its line breaks", "title=fence(flat(title))", "title=fence(title)"),
    ("validator: agrees with any statuses", "        return mine == leader_statuses", "        return True"),
    ("validator: compares only the first term", "        return mine == leader_statuses", "        return mine[0] == leader_statuses[0]"),
    ("validator: agrees with a leader that could not answer", "            # committee that can answer gets to.\n            return False", "            # committee that can answer gets to.\n            return True"),
    ("orders: only the first order is asked", "    backward_prompt = judge_prompt(title, b, a)", "    backward_prompt = judge_prompt(title, a, b)"),
    ("merge: the forward read wins a disagreement", "else DIFFER for index in range(len(TERMS))]", "else forward[index] for index in range(len(TERMS))]"),
    ("merge: a disagreement reads as a match", "else DIFFER for index in range(len(TERMS))]", "else MATCH for index in range(len(TERMS))]"),
    ("read: an unknown status passes", "        if status not in STATUSES:\n            raise gl.vm.UserError(L + \"bad status for \" + term)", "        if False:\n            raise gl.vm.UserError(L + \"bad status for \" + term)"),
    ("read: no retry on a formatting slip", "    raw = gl.nondet.exec_prompt(prompt)\n    read_statuses(raw)\n    return raw", "    raise gl.vm.UserError(L + \"no retry\")"),
    ("notes: unbounded", "MAX_NOTE = 240", "MAX_NOTE = 24000"),
    # the verdict in code
    ("verdict: a difference is ignored", "    if DIFFER in statuses:\n        return DIFFERENT", "    if False:\n        return DIFFERENT"),
    ("verdict: a missing required term is ignored", "        if statuses[TERMS.index(term)] == ABSENT:\n            return GAPS", "        if False:\n            return GAPS"),
    ("verdict: payment is required", 'REQUIRED = ("amount", "deliverable", "deadline")', 'REQUIRED = ("amount", "deliverable", "deadline", "payment")'),
    ("verdict: the deadline is optional", 'REQUIRED = ("amount", "deliverable", "deadline")', 'REQUIRED = ("amount", "deliverable")'),
    ("check: a third round", "MAX_ROUNDS = 2", "MAX_ROUNDS = 3"),
    ("check: round 2 differing keeps the page open", "        elif int(pg.round) < MAX_ROUNDS:", "        elif True:"),
    ("check: not agreed keeps the deposits", "            self._close(pg, NOT_AGREED, deposit, deposit, now, gl.message.sender_address)\n            summary", "            self._close(pg, NOT_AGREED, 0, 0, now, gl.message.sender_address)\n            summary"),
    # signing
    ("sign: twice by the opener", "            if int(pg.opener_signed_at) > 0:\n", "            if False:\n"),
    ("sign: one signature is enough", "        if int(pg.opener_signed_at) > 0 and int(pg.counterparty_signed_at) > 0:\n            deposit", "        if int(pg.opener_signed_at) > 0 or int(pg.counterparty_signed_at) > 0:\n            deposit"),
    ("sign: agreed keeps the deposits", "            self._close(pg, AGREED, deposit, deposit, now, gl.message.sender_address)", "            self._close(pg, AGREED, 0, 0, now, gl.message.sender_address)"),
    # no-shows
    ("no_show: before the window closes", '        if now < int(pg.step_end):\n            raise gl.vm.UserError(E + "the window for this step is still open")', '        if False:\n            raise gl.vm.UserError(E + "the window for this step is still open")'),
    ("no_show: a closed page closes again", '        if pg.status != OPEN:\n            raise gl.vm.UserError(E + "this page is closed, " + pg.status)\n        now = self._now()\n        if now < int(pg.step_end)', '        if False:\n            raise gl.vm.UserError(E + "this page is closed, " + pg.status)\n        now = self._now()\n        if now < int(pg.step_end)'),
    ("no_show: a missed join pays the opener double", "            self._close(pg, NO_SHOW, deposit, 0, now, by)\n            return NO_SHOW\n        if pg.step == CHECK", "            self._close(pg, NO_SHOW, deposit * 2, 0, now, by)\n            return NO_SHOW\n        if pg.step == CHECK"),
    ("no_show: the absent side keeps its deposit", "            self._close(pg, NO_SHOW, 0, deposit * 2, now, by)", "            self._close(pg, NO_SHOW, deposit, deposit, now, by)"),
    ("no_show: the opener is paid for the opener's absence", "            self._close(pg, NO_SHOW, deposit * 2, 0, now, by)\n        return NO_SHOW", "            self._close(pg, NO_SHOW, 0, deposit * 2, now, by)\n        return NO_SHOW"),
    ("no_show: both absent, nobody refunded", "            self._close(pg, NO_SHOW, deposit, deposit, now, by)\n        elif opener_missed:", "            self._close(pg, NO_SHOW, 0, 0, now, by)\n        elif opener_missed:"),
    ("no_show: a stalled check keeps the deposits", "            self._close(pg, NOT_AGREED, deposit, deposit, now, by)\n            return NOT_AGREED", "            self._close(pg, NOT_AGREED, 0, 0, now, by)\n            return NOT_AGREED"),
    ("no_show: absence is not recorded", '        pg.absent = ",".join(missed)\n', ""),
    ("no_show: signing absence read from the seals", "            opener_missed = int(pg.opener_signed_at) == 0\n            counterparty_missed = int(pg.counterparty_signed_at) == 0", "            opener_missed = r.opener_seal == \"\"\n            counterparty_missed = r.counterparty_seal == \"\""),
    # balances and views
    ("credit: overwrites instead of adding", "        self.balances[key] = u256(int(self.balances.get(key, 0)) + amount)", "        self.balances[key] = u256(amount)"),
    ("index: the counterparty's list is skipped", "        self._index(other, pid)\n", ""),
    ("list: the page size is unbounded", "MAX_PAGE = 50", "MAX_PAGE = 5000"),

]

#: Mutants that cannot change behaviour, so no test can catch them, with the
#: reason. They are listed in the table rather than silently dropped.
EQUIVALENT = [
    (
        "check: a round is checked twice",
        "check() refuses unless the page is on its CHECK step, and the first verdict always moves the page to SIGN, SEAL "
        "(round 2) or DONE, so the `r.verdict != \"\"` clause in the readiness test can never be the one that refuses.",
    ),
]
