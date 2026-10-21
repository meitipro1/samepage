"""
Every method and every rule in section 2 of the build spec, against the real
contract file, with the judge mocked per node.

check() asks the judge twice on every node, once in each presentation order,
so a test queues two answers per check: (forward, backward).
"""

from __future__ import annotations

import json

import pytest

import genvm_double as D
from harness import GAPPY, GEN, HOUR, KILN, SAME, SERA, T0, TERMS, TITLE, TWO_DIFFER, World, judged, refused, seal

A, B, S = World.OPENER, World.OTHER, World.STRANGER
DEP = World.DEPOSIT

# --- open_page ----------------------------------------------------------------------


def test_open_records_the_page_and_its_first_window():
    w = World()
    assert w.open() == 1
    p = w.page()
    assert p["found"] and p["opener"].lower() == A and p["counterparty"].lower() == B
    assert p["title"] == TITLE and p["deposit"] == str(DEP) and p["window_hours"] == 48
    assert p["status"] == "OPEN" and p["step"] == "JOIN" and p["round"] == 1
    assert p["opened_at"] == T0 and p["step_at"] == T0 and p["step_end"] == T0 + 48 * HOUR
    assert p["rounds"][0]["opener_seal"] == "" and p["rounds"][0]["verdict"] == ""
    assert p["closed_by"] == "" and p["absent"] == []
    assert w.open() == 2


def test_a_zero_deposit_page_is_allowed():
    w = World()
    w.open(deposit=0)
    assert w.page()["deposit"] == "0"


def test_the_title_is_flattened_to_one_line():
    w = World()
    w.open(title="  Kiln\nlaunch   posts ")
    assert w.page()["title"] == "Kiln launch posts"


@pytest.mark.parametrize(
    "kwargs, sentence",
    [
        ({"title": "   "}, "the title is empty"),
        ({"title": "x" * 81}, "at most 80 characters"),
        ({"window": 5}, "6 to 96 hours"),
        ({"window": 97}, "6 to 96 hours"),
        ({"deposit": -1, "value": 0}, "zero or more wei"),
        ({"counterparty": "0x1234"}, "the counterparty is an address"),
        ({"counterparty": "0x" + "zz" * 20}, "the counterparty is an address"),
        ({"counterparty": World.OPENER.upper().replace("0X", "0x")}, "another account, not the opener"),
        ({"counterparty": "0x" + "00" * 20}, "cannot be the zero address"),
        ({"value": DEP - 1}, "send exactly the deposit"),
        ({"value": DEP + 1}, "send exactly the deposit"),
    ],
)
def test_open_refusals(kwargs, sentence):
    w = World()
    refused(sentence, w.open, **kwargs)
    assert w.page()["found"] is False


def test_open_refuses_non_integers():
    w = World()
    w.sender(A, 0)
    refused("is a whole number", w.c.open_page, TITLE, B, True, 48)
    refused("is a whole number", w.c.open_page, TITLE, B, 0, "48")


def test_windows_at_the_bounds_are_accepted():
    w = World()
    w.open(window=6)
    w.open(window=96)
    assert w.page(1)["step_end"] == T0 + 6 * HOUR and w.page(2)["step_end"] == T0 + 96 * HOUR


# --- join ------------------------------------------------------------------------------


def test_the_named_counterparty_joins_and_sealing_starts():
    w = World()
    w.open()
    w.advance(HOUR)
    assert w.join() == "SEAL"
    p = w.page()
    assert p["step"] == "SEAL" and p["joined_at"] == T0 + HOUR and p["step_end"] == T0 + HOUR + 48 * HOUR


def test_only_the_named_counterparty_may_join():
    w = World()
    w.open()
    refused("only the counterparty named", w.join, who=S)
    refused("only the counterparty named", w.join, who=A, value=DEP)


def test_join_wants_the_same_deposit():
    w = World()
    w.open()
    refused("send exactly the deposit", w.join, value=DEP - 1)
    refused("send exactly the deposit", w.join, value=DEP + 1)
    refused("send exactly the deposit", w.join, value=0)


def test_join_after_its_window_is_refused():
    w = World()
    w.open()
    w.to_end()
    refused("the window for this step has closed", w.join)


def test_join_twice_is_refused():
    w = World()
    w.open()
    w.join()
    refused("joining is not the step", w.join)


def test_a_counterparty_given_in_lower_case_joins_from_a_checksummed_wallet():
    w = World()
    mixed = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01"
    w.open(counterparty=mixed.lower())
    assert w.join(who=mixed) == "SEAL"


# --- seal ------------------------------------------------------------------------------


def test_both_seals_move_the_page_to_opening():
    w = World()
    w.open()
    w.join()
    assert w.seal(A, KILN) == "SEAL"
    assert w.seal(B, SERA) == "REVEAL"
    r = w.round()
    assert r["opener_seal"] == seal(KILN, "salt-" + A[2:14] + "-r1", A)
    assert r["counterparty_seal"] == seal(SERA, "salt-" + B[2:14] + "-r1", B)
    assert r["opener_text"] == "" and r["counterparty_text"] == ""


def test_a_seal_before_the_counterparty_joins_is_refused():
    w = World()
    w.open()
    refused("sealing is not the step", w.seal, A, KILN)


def test_only_the_two_sides_may_seal():
    w = World()
    w.open()
    w.join()
    refused("only the two sides", w.seal, S, KILN)


def test_a_side_seals_once_per_round():
    w = World()
    w.open()
    w.join()
    w.seal(A, KILN)
    refused("already sealed this round", w.seal, A, "another text")
    w2 = World()
    w2.open()
    w2.join()
    w2.seal(B, SERA)
    refused("already sealed this round", w2.seal, B, "another text")


def test_a_seal_must_be_a_hash():
    w = World()
    w.open()
    w.join()
    refused("a seal is a sha256 hash", w.seal, A, KILN, seal_hex="abc")
    refused("a seal is a sha256 hash", w.seal, A, KILN, seal_hex="g" * 64)


def test_a_seal_is_stored_in_lower_case_without_0x():
    w = World()
    w.open()
    w.join()
    digest = seal(KILN, "salt-a1a1a1a1a1a1-r1", A)
    w.seal(A, KILN, seal_hex="0x" + digest.upper())
    assert w.round()["opener_seal"] == digest


def test_a_seal_after_the_window_is_refused():
    w = World()
    w.open()
    w.join()
    w.to_end()
    refused("the window for this step has closed", w.seal, A, KILN)


# --- reveal ----------------------------------------------------------------------------


def test_nobody_opens_before_both_have_sealed():
    w = World()
    w.open()
    w.join()
    w.seal(A, KILN)
    refused("accounts open only after both sides have sealed", w.reveal, A)


def test_both_opened_accounts_move_the_page_to_checking():
    w = World()
    w.open()
    w.to_reveal()
    assert w.reveal(A) == "REVEAL"
    assert w.reveal(B) == "CHECK"
    r = w.round()
    assert r["opener_text"] == KILN and r["counterparty_text"] == SERA
    assert r["opener_salt"] == "salt-" + A[2:14] + "-r1" and r["opener_opened_at"] == T0


def test_an_account_that_does_not_match_its_seal_is_refused():
    w = World()
    w.open()
    w.to_reveal()
    refused("do not match this side's seal", w.reveal, A, text=KILN + " ")
    refused("do not match this side's seal", w.reveal, A, salt="another-salt")


def test_a_seal_copied_from_the_other_side_can_never_be_opened():
    """The address is inside the hash: Sera copies Kiln's seal, and even with Kiln's text and salt it does not open."""
    w = World()
    w.open()
    w.join()
    w.seal(A, KILN, salt="kiln-salt-0001")
    copied = w.round()["opener_seal"]
    w.seal(B, KILN, seal_hex=copied)
    w.tickets[(1, 1, B)] = (KILN, "kiln-salt-0001")
    refused("do not match this side's seal", w.reveal, B)


def test_a_side_opens_once():
    w = World()
    w.open()
    w.to_reveal()
    w.reveal(A)
    refused("already opened its account", w.reveal, A)


def test_only_the_two_sides_may_open():
    w = World()
    w.open()
    w.to_reveal()
    w.sender(S)
    refused("only the two sides", w.c.reveal, 1, KILN, "salt-whatever")


def test_salt_rules():
    w = World()
    w.open()
    w.to_reveal()
    refused("the salt is 8 to 80", w.reveal, A, salt="short")
    refused("the salt is 8 to 80", w.reveal, A, salt="has|a|bar1")
    refused("the salt is 8 to 80", w.reveal, A, salt="x" * 81)


def test_an_empty_or_long_account_never_opens():
    w = World()
    w.open()
    w.join()
    w.seal(A, "   ")
    w.seal(B, "x" * 1201)
    refused("the account is empty", w.reveal, A)
    refused("at most 1,200 characters", w.reveal, B)


def test_the_longest_account_opens():
    w = World()
    w.open()
    w.to_reveal(a="é" * 1200)
    w.reveal(A)
    assert w.round()["opener_text"] == "é" * 1200


def test_a_text_with_bars_and_line_breaks_opens_byte_for_byte():
    w = World()
    w.open()
    text = "Line one | with a bar\nLine two\r\nthree"
    w.to_reveal(a=text)
    w.reveal(A)
    assert w.round()["opener_text"] == text


def test_reveal_after_its_window_is_refused():
    w = World()
    w.open()
    w.to_reveal()
    w.to_end()
    refused("the window for this step has closed", w.reveal, A)


# --- check ------------------------------------------------------------------------------


def test_same_page_moves_to_signing_and_stores_the_statuses():
    w = World()
    w.open()
    w.to_check()
    w.advance(60)
    assert w.check(1, SAME, SAME) == "SAME_PAGE"
    p, r = w.page(), w.round()
    assert p["step"] == "SIGN" and p["step_end"] == w.t + 48 * HOUR
    assert r["verdict"] == "SAME_PAGE" and r["count"] == 0
    assert r["statuses"] == dict(zip(TERMS, ["MATCH", "MATCH", "MATCH", "MATCH", "ABSENT", "ABSENT"]))
    assert r["checked_by"].lower() == S and r["checked_at"] == w.t
    assert r["notes"]["amount"] == "amount: what each side says"


def test_different_names_the_count_and_opens_round_two():
    w = World()
    w.open()
    w.to_check()
    assert w.check(1, TWO_DIFFER, TWO_DIFFER) == "DIFFERENT 2"
    p = w.page()
    assert p["round"] == 2 and p["step"] == "SEAL" and p["status"] == "OPEN"
    assert p["rounds"][0]["verdict"] == "DIFFERENT" and p["rounds"][0]["count"] == 2
    assert p["rounds"][1]["opener_seal"] == "" and p["rounds"][1]["verdict"] == ""


def test_gaps_names_the_missing_required_terms():
    w = World()
    w.open()
    w.to_check()
    assert w.check(1, GAPPY, GAPPY) == "GAPS 2"
    assert w.page()["rounds"][0]["verdict"] == "GAPS" and w.page()["round"] == 2


@pytest.mark.parametrize(
    "statuses, verdict",
    [
        (["MATCH"] * 6, "SAME_PAGE"),
        (["MATCH", "MATCH", "MATCH", "ABSENT", "ABSENT", "ABSENT"], "SAME_PAGE"),
        (["ABSENT", "MATCH", "MATCH", "ABSENT", "ABSENT", "ABSENT"], "GAPS"),
        (["MATCH", "ABSENT", "MATCH", "MATCH", "MATCH", "MATCH"], "GAPS"),
        (["MATCH", "MATCH", "ABSENT", "MATCH", "MATCH", "MATCH"], "GAPS"),
        (["ABSENT", "ABSENT", "ABSENT", "ABSENT", "ABSENT", "DIFFER"], "DIFFERENT"),
        (["DIFFER", "ABSENT", "ABSENT", "ABSENT", "ABSENT", "ABSENT"], "DIFFERENT"),
        (["MATCH", "MATCH", "MATCH", "MATCH", "MATCH", "DIFFER"], "DIFFERENT"),
    ],
)
def test_the_verdict_is_computed_in_code(statuses, verdict):
    w = World()
    w.open()
    w.to_check()
    answer = judged(*statuses)
    w.check(1, answer, answer)
    assert w.page()["rounds"][0]["verdict"] == verdict


def test_the_two_orders_disagreeing_on_a_term_store_differ():
    """Forward says MATCH on payment, backward says DIFFER: the stored status is DIFFER, never the leader's first read."""
    w = World()
    w.open()
    w.to_check()
    backward = judged("MATCH", "MATCH", "MATCH", "DIFFER", "ABSENT", "ABSENT")
    assert w.check(1, SAME, backward) == "DIFFERENT 1"
    assert w.page()["rounds"][0]["statuses"]["payment"] == "DIFFER"


def test_match_against_absent_across_orders_is_differ():
    w = World()
    w.open()
    w.to_check()
    backward = judged("MATCH", "MATCH", "MATCH", "MATCH", "MATCH", "ABSENT")
    w.check(1, SAME, backward)
    assert w.page()["rounds"][0]["statuses"]["rights"] == "DIFFER"


def test_the_backward_prompt_swaps_the_accounts():
    w = World()
    w.open()
    w.to_check()
    w.check(1, SAME, SAME)
    forward, backward = w.leader.prompts[-2], w.leader.prompts[-1]
    assert forward.index(KILN) < forward.index(SERA)
    assert backward.index(SERA) < backward.index(KILN)
    assert forward.replace(KILN, "@@").replace(SERA, KILN).replace("@@", SERA) == backward


def test_validators_disagreeing_on_a_status_is_a_disagreement():
    w = World()
    w.open()
    w.to_check()
    other = judged("MATCH", "MATCH", "MATCH", "DIFFER", "ABSENT", "ABSENT")
    with pytest.raises(D.VMError):
        w.check(1, SAME, SAME, validator=[other, other])
    assert w.round()["verdict"] == "" and w.page()["step"] == "CHECK"


def test_validators_disagreeing_only_on_the_notes_still_agree():
    w = World()
    w.open()
    w.to_check()
    worded = judged("MATCH", "MATCH", "MATCH", "MATCH", "ABSENT", "ABSENT", notes={"amount": "both say a different thing here"})
    assert w.check(1, SAME, SAME, validator=[worded, worded]) == "SAME_PAGE"
    assert w.round()["notes"]["amount"] == "amount: what each side says"


def test_each_node_reads_with_its_own_world():
    """Every validator asks the model itself, twice; none reuses the leader's answer."""
    w = World()
    w.gl.nondet.validators.append(D.NodeWorld("validator 2"))
    w.open()
    w.to_check()
    w.check(1, SAME, SAME)
    assert len(w.leader.prompts) == 2
    for v in w.validators:
        assert len(v.prompts) == 2 and v.prompts == w.leader.prompts


def test_a_formatting_slip_is_asked_once_more():
    w = World()
    w.open()
    w.to_check()
    assert w.check(1, "not json", SAME, SAME, validator=[SAME, SAME]) == "SAME_PAGE"
    assert len(w.leader.prompts) == 3


def test_two_formatting_slips_leave_the_round_unchecked():
    w = World()
    w.open()
    w.to_check()
    with pytest.raises(D.VMError):
        w.check(1, "not json", '{"amount": "MAYBE"}', validator=[SAME, SAME])
    assert w.round()["verdict"] == ""


def test_a_fenced_code_answer_reads():
    w = World()
    w.open()
    w.to_check()
    fenced = "```json\n" + SAME + "\n```"
    assert w.check(1, fenced, fenced) == "SAME_PAGE"


def test_notes_are_one_line_strings_and_cut_short():
    w = World()
    w.open()
    w.to_check()
    answer = judged("MATCH", "MATCH", "MATCH", "MATCH", "ABSENT", "ABSENT", notes={"amount": "a\nb  " + "x" * 400, "rights": 5, "bogus": "y"})
    w.check(1, answer, answer)
    notes = w.round()["notes"]
    assert set(notes) == {"amount"} and notes["amount"].startswith("a b x") and len(notes["amount"]) == 240


def test_check_before_both_open_is_refused():
    w = World()
    w.open()
    w.to_reveal()
    w.reveal(A)
    refused("checking is not the step", w.check, 1)


def test_check_twice_is_refused():
    w = World()
    w.open()
    w.to_check()
    w.check(1, SAME, SAME)
    refused("checking is not the step", w.check, 1)


def test_anyone_may_check_and_is_recorded():
    w = World()
    w.open()
    w.to_check()
    w.check(1, SAME, SAME, who=A)
    assert w.round()["checked_by"].lower() == A


def test_round_two_not_same_page_closes_not_agreed_with_both_deposits_back():
    w = World()
    w.open()
    w.to_check()
    w.check(1, TWO_DIFFER, TWO_DIFFER)
    w.to_check()
    assert w.check(1, GAPPY, GAPPY) == "GAPS 2, not agreed"
    p = w.page()
    assert p["status"] == "NOT_AGREED" and p["step"] == "DONE" and p["absent"] == []
    assert p["opener_payout"] == str(DEP) and p["counterparty_payout"] == str(DEP)
    assert w.balance(A) == DEP and w.balance(B) == DEP
    assert p["rounds"][1]["verdict"] == "GAPS"


def test_round_two_same_page_goes_to_signing():
    w = World()
    w.open()
    w.to_check()
    w.check(1, TWO_DIFFER, TWO_DIFFER)
    w.to_check(a="round two, Kiln", b="round two, Sera")
    assert w.check(1, SAME, SAME) == "SAME_PAGE"
    p = w.page()
    assert p["step"] == "SIGN" and p["round"] == 2
    assert p["rounds"][0]["opener_text"] == KILN and p["rounds"][1]["opener_text"] == "round two, Kiln"


def test_a_round_one_seal_cannot_be_reused_in_round_two():
    w = World()
    w.open()
    w.to_check()
    w.check(1, TWO_DIFFER, TWO_DIFFER)
    w.seal(A, "new text")
    refused("already sealed this round", w.seal, A, "again")


def test_check_after_its_window_is_refused():
    w = World()
    w.open()
    w.to_check()
    w.to_end()
    refused("the window for this step has closed", w.check, 1)


# --- sign --------------------------------------------------------------------------------


def test_both_signatures_make_it_agreed_and_return_both_deposits():
    w = World()
    w.open()
    w.to_check()
    w.check(1, SAME, SAME)
    w.advance(HOUR)
    assert w.sign(A) == "SIGN"
    assert w.page()["opener_signed_at"] == w.t and w.page()["status"] == "OPEN"
    w.advance(HOUR)
    assert w.sign(B) == "AGREED"
    p = w.page()
    assert p["status"] == "AGREED" and p["counterparty_signed_at"] == w.t and p["closed_by"].lower() == B
    assert w.balance(A) == DEP and w.balance(B) == DEP


def test_sign_only_on_same_page():
    w = World()
    w.open()
    w.to_check()
    refused("signing is not the step", w.sign, A)
    w.check(1, TWO_DIFFER, TWO_DIFFER)
    refused("signing is not the step", w.sign, A)


def test_a_side_signs_once_and_strangers_never():
    w = World()
    w.open()
    w.to_check()
    w.check(1, SAME, SAME)
    w.sign(A)
    refused("already signed", w.sign, A)
    refused("only the two sides", w.sign, S)


def test_sign_after_its_window_is_refused():
    w = World()
    w.open()
    w.to_check()
    w.check(1, SAME, SAME)
    w.to_end()
    refused("the window for this step has closed", w.sign, A)


def test_a_closed_page_refuses_everything():
    w = World()
    w.open()
    w.agree()
    for fn in (lambda: w.sign(A), lambda: w.seal(A, "x"), lambda: w.check(1), lambda: w.join(), lambda: w.no_show()):
        refused("this page is closed, AGREED", fn)


# --- no_show --------------------------------------------------------------------------------


def test_no_show_waits_for_the_window():
    w = World()
    w.open()
    w.at(w.page()["step_end"] - 1)
    refused("still open", w.no_show)


def test_a_counterparty_who_never_joins_gives_the_opener_their_deposit_back():
    w = World()
    w.open()
    w.to_end()
    assert w.no_show() == "NO_SHOW"
    p = w.page()
    assert p["status"] == "NO_SHOW" and p["absent"] == [B] and p["closed_by"].lower() == S
    assert p["opener_payout"] == str(DEP) and p["counterparty_payout"] == "0"
    assert w.balance(A) == DEP and w.balance(B) == 0


def test_a_side_that_never_seals_loses_its_deposit_to_the_other():
    w = World()
    w.open()
    w.join()
    w.seal(A, KILN)
    w.to_end()
    w.no_show()
    p = w.page()
    assert p["absent"] == [B] and p["opener_payout"] == str(2 * DEP) and p["counterparty_payout"] == "0"
    assert w.balance(A) == 2 * DEP and w.balance(B) == 0


def test_a_side_that_never_opens_loses_its_deposit_to_the_other():
    w = World()
    w.open()
    w.to_reveal()
    w.reveal(B)
    w.to_end()
    w.no_show()
    p = w.page()
    assert p["absent"] == [A] and w.balance(A) == 0 and w.balance(B) == 2 * DEP


def test_a_side_that_never_signs_loses_its_deposit_to_the_other():
    w = World()
    w.open()
    w.to_check()
    w.check(1, SAME, SAME)
    w.sign(B)
    w.to_end()
    w.no_show()
    assert w.page()["absent"] == [A] and w.balance(B) == 2 * DEP and w.balance(A) == 0


def test_both_absent_each_gets_their_own_back():
    w = World()
    w.open()
    w.join()
    w.to_end()
    w.no_show()
    p = w.page()
    assert p["status"] == "NO_SHOW" and p["absent"] == [A, B]
    assert w.balance(A) == DEP and w.balance(B) == DEP


def test_a_check_that_never_settles_closes_not_agreed_with_nobody_absent():
    """Somewhere to go when the validators never agree: after the check window, both deposits come back."""
    w = World()
    w.open()
    w.to_check()
    w.to_end()
    assert w.no_show() == "NOT_AGREED"
    p = w.page()
    assert p["status"] == "NOT_AGREED" and p["absent"] == []
    assert w.balance(A) == DEP and w.balance(B) == DEP


def test_no_show_in_round_two_seal():
    w = World()
    w.open()
    w.to_check()
    w.check(1, TWO_DIFFER, TWO_DIFFER)
    w.seal(B, "round two")
    w.to_end()
    w.no_show()
    assert w.page()["absent"] == [A] and w.balance(B) == 2 * DEP


def test_no_show_is_anyone_s_and_recorded():
    w = World()
    w.open()
    w.to_end()
    w.no_show(who=A)
    assert w.page()["closed_by"].lower() == A


def test_no_show_on_a_closed_page_is_refused():
    w = World()
    w.open()
    w.to_end()
    w.no_show()
    refused("this page is closed, NO_SHOW", w.no_show)


# --- withdraw ---------------------------------------------------------------------------------


def test_withdraw_pays_the_balance_once():
    w = World()
    w.open()
    w.agree()
    assert w.withdraw(A) == DEP
    assert w.paid_to(A) == DEP and w.balance(A) == 0
    assert w.pages(A)["withdrawn"] == str(DEP)
    refused("nothing to withdraw", w.withdraw, A)


def test_withdraw_with_nothing_is_refused():
    w = World()
    refused("nothing to withdraw", w.withdraw, S)


def test_withdraw_sums_every_page():
    w = World()
    w.open()
    w.open()
    w.agree(1)
    w.to_end(2)
    w.no_show(2)
    assert w.withdraw(A) == 2 * DEP


def test_zero_deposit_pages_move_no_money():
    w = World()
    w.open(deposit=0)
    w.agree()
    assert w.page()["status"] == "AGREED" and w.credited() == 0
    refused("nothing to withdraw", w.withdraw, A)


@pytest.mark.parametrize("path", ["agreed", "not_agreed", "no_join", "no_seal", "no_reveal", "no_sign", "both_absent", "no_check"])
def test_money_always_adds_up(path):
    """Every wei taken in is credited exactly once, and withdraw pays out exactly what was credited."""
    w = World()
    w.open()
    if path == "agreed":
        w.agree()
    elif path == "not_agreed":
        w.to_check()
        w.check(1, TWO_DIFFER, TWO_DIFFER)
        w.to_check()
        w.check(1, TWO_DIFFER, TWO_DIFFER)
    elif path == "no_join":
        w.to_end().no_show()
    elif path == "no_seal":
        w.join()
        w.seal(B, SERA)
        w.to_end().no_show()
    elif path == "no_reveal":
        w.to_reveal()
        w.reveal(A)
        w.to_end().no_show()
    elif path == "no_sign":
        w.to_check()
        w.check(1, SAME, SAME)
        w.sign(A)
        w.to_end().no_show()
    elif path == "both_absent":
        w.join()
        w.to_end().no_show()
    elif path == "no_check":
        w.to_check()
        w.to_end().no_show()
    taken = DEP if path == "no_join" else 2 * DEP
    assert w.credited() == taken
    for who in (A, B):
        if w.balance(who) > 0:
            w.withdraw(who)
    assert w.paid_out() == taken and w.credited() == 0


# --- views -----------------------------------------------------------------------------------


def test_unknown_page_is_not_found_and_writes_refuse():
    w = World()
    assert w.page(7) == {"found": False}
    refused("unknown page", w.join, 7, value=0)


def test_list_pages_by_address_and_everyone():
    w = World()
    w.open()
    w.open(counterparty=S)
    w.open(who=B, counterparty=S)
    assert [p["id"] for p in w.pages()["items"]] == [3, 2, 1]
    assert [p["id"] for p in w.pages(A)["items"]] == [2, 1]
    assert [p["id"] for p in w.pages(B.upper().replace("0X", "0x"))["items"]] == [3, 1]
    assert [p["id"] for p in w.pages(S)["items"]] == [3, 2]
    assert w.pages(A, offset=1, limit=1)["items"][0]["id"] == 1 and w.pages(A)["total"] == 2
    assert w.pages("0x" + "ee" * 20)["items"] == []


def test_list_pages_shows_the_last_verdict_while_round_two_is_open():
    w = World()
    w.open()
    w.to_check()
    w.check(1, TWO_DIFFER, TWO_DIFFER)
    item = w.pages()["items"][0]
    assert item["last_verdict"] == "DIFFERENT" and item["last_count"] == 2 and item["round"] == 2


def test_list_pages_shows_balances():
    w = World()
    w.open()
    w.agree()
    out = w.pages(A)
    assert out["balance"] == str(DEP) and out["withdrawn"] == "0"


def test_limits_on_list_pages():
    w = World()
    for _ in range(51):
        w.open(deposit=0)
    assert len(w.pages(limit=0)["items"]) == 1
    assert len(w.pages(limit=500)["items"]) == 50
    assert w.pages(offset=50, limit=500)["items"][0]["id"] == 1
    assert w.pages(offset=-4)["offset"] == 0


def test_the_whole_story_of_the_spec():
    """Kiln and Sera: DIFFERENT 2 in round 1, SAME PAGE in round 2, both sign, both deposits back."""
    w = World()
    assert w.open() == 1
    w.join()
    w.to_check()
    assert w.check(1, TWO_DIFFER, TWO_DIFFER) == "DIFFERENT 2"
    kiln2 = "Sera writes 3 posts and a thread on X about the Kiln launch, all live by Oct 24. 600 USDC, half before Sera starts and half after the thread. Kiln may repost and quote."
    sera2 = "I write 3 posts and one thread on X about the Kiln launch, all live by Oct 24. 600 USDC, half before I start and half after the thread is live. Kiln can repost and quote them."
    w.to_check(a=kiln2, b=sera2)
    assert w.check(1, SAME, SAME) == "SAME_PAGE"
    w.sign(A)
    assert w.sign(B) == "AGREED"
    assert w.withdraw(A) == DEP and w.withdraw(B) == DEP
    p = w.page()
    assert [r["verdict"] for r in p["rounds"]] == ["DIFFERENT", "SAME_PAGE"]
    assert json.loads(w.c.get_page(1))["rounds"][1]["counterparty_text"] == sera2
