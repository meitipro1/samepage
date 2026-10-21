# Mutations

Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. 76 defences in
`contracts/samepage.py` were each broken on their own, and every mutant was caught. Each row
names the first test that failed against it, read from pytest's report rather than an exit code.
The generated-files and deployed-record tests are excluded, because they fail for any edit at all.

| # | defence broken | caught by |
|---|---|---|
| 1 | join: anyone joins | `tests/test_direct.py::test_only_the_named_counterparty_may_join` |
| 2 | join: addresses compared as text | `tests/test_direct.py::test_a_counterparty_given_in_lower_case_joins_from_a_checksummed_wallet` |
| 3 | side: a stranger acts as the counterparty | `tests/test_direct.py::test_only_the_two_sides_may_seal` |
| 4 | side: the counterparty acts as the opener | `tests/test_direct.py::test_both_seals_move_the_page_to_opening` |
| 5 | open: the opener names themself | `tests/test_direct.py::test_open_refusals[kwargs7-another` |
| 6 | open: the zero address as counterparty | `tests/test_direct.py::test_open_refusals[kwargs8-cannot` |
| 7 | open: the page is recorded as nobody's | `tests/test_direct.py::test_open_records_the_page_and_its_first_window` |
| 8 | check: the caller is not recorded | `tests/test_direct.py::test_same_page_moves_to_signing_and_stores_the_statuses` |
| 9 | close: the caller is not recorded | `tests/test_direct.py::test_both_signatures_make_it_agreed_and_return_both_deposits` |
| 10 | withdraw: pays a fixed address | `tests/test_direct.py::test_withdraw_pays_the_balance_once` |
| 11 | withdraw: the balance is not zeroed | `tests/test_direct.py::test_withdraw_pays_the_balance_once` |
| 12 | withdraw: pays with nothing due | `tests/test_direct.py::test_withdraw_pays_the_balance_once` |
| 13 | open: any value with the page | `tests/test_direct.py::test_open_refusals[kwargs9-send` |
| 14 | join: any deposit | `tests/test_direct.py::test_join_wants_the_same_deposit` |
| 15 | join: a deposit above the page's | `tests/test_direct.py::test_join_wants_the_same_deposit` |
| 16 | open: a negative deposit | `tests/test_direct.py::test_open_refusals[kwargs4-zero` |
| 17 | open: a five-hour window | `tests/test_direct.py::test_open_refusals[kwargs2-6` |
| 18 | open: a 97-hour window | `tests/test_direct.py::test_open_refusals[kwargs3-6` |
| 19 | open: the title is unbounded | `tests/test_direct.py::test_open_refusals[kwargs1-at` |
| 20 | open: an empty title | `tests/test_direct.py::test_open_refusals[kwargs0-the` |
| 21 | open: a malformed counterparty | `tests/test_direct.py::test_open_refusals[kwargs6-the` |
| 22 | windows: a step never closes | `tests/test_direct.py::test_join_after_its_window_is_refused` |
| 23 | windows: a closed page takes writes | `tests/test_direct.py::test_a_closed_page_refuses_everything` |
| 24 | windows: any step takes any write | `tests/test_direct.py::test_join_twice_is_refused` |
| 25 | windows: the window is not restarted per step | `tests/test_direct.py::test_the_named_counterparty_joins_and_sealing_starts` |
| 26 | seal: twice by the opener | `tests/test_direct.py::test_a_side_seals_once_per_round` |
| 27 | seal: twice by the counterparty | `tests/test_direct.py::test_a_side_seals_once_per_round` |
| 28 | seal: opening starts after one seal | `tests/test_direct.py::test_both_seals_move_the_page_to_opening` |
| 29 | seal: any text passes as a seal | `tests/test_direct.py::test_a_seal_must_be_a_hash` |
| 30 | reveal: the seal is not checked | `tests/test_direct.py::test_an_account_that_does_not_match_its_seal_is_refused` |
| 31 | reveal: checked against the other side's seal | `tests/test_direct.py::test_both_opened_accounts_move_the_page_to_checking` |
| 32 | reveal: opened twice | `tests/test_direct.py::test_a_side_opens_once` |
| 33 | reveal: an empty account | `tests/test_direct.py::test_an_empty_or_long_account_never_opens` |
| 34 | reveal: an account of any length | `tests/test_direct.py::test_an_empty_or_long_account_never_opens` |
| 35 | reveal: checking starts after one open | `tests/test_direct.py::test_both_opened_accounts_move_the_page_to_checking` |
| 36 | salt: a bar in the salt | `tests/test_direct.py::test_salt_rules` |
| 37 | salt: any length | `tests/test_direct.py::test_salt_rules` |
| 38 | seal: the address is not hashed | `tests/test_direct.py::test_both_opened_accounts_move_the_page_to_checking` |
| 39 | seal: the address keeps its case | `tests/test_static.py::test_the_contract_seal_matches_the_shared_vectors[7f3a0c55-2b1e-4d1a-9b7c-e91c00000001]` |
| 40 | seal: the bar is dropped between fields | `tests/test_direct.py::test_both_opened_accounts_move_the_page_to_checking` |
| 41 | fence: the delimiters pass through | `tests/test_static.py::test_the_blocks_close_where_the_contract_closes_them` |
| 42 | fence: deletes instead of replacing | `tests/test_static.py::test_the_blocks_close_where_the_contract_closes_them` |
| 43 | prompt: the title is not fenced | `tests/test_static.py::test_every_judge_prompt_value_is_fenced` |
| 44 | prompt: account B is not fenced | `tests/test_static.py::test_every_judge_prompt_value_is_fenced` |
| 45 | prompt: the title keeps its line breaks | `tests/test_static.py::test_every_judge_prompt_value_is_fenced` |
| 46 | validator: agrees with any statuses | `tests/test_direct.py::test_validators_disagreeing_on_a_status_is_a_disagreement` |
| 47 | validator: compares only the first term | `tests/test_direct.py::test_validators_disagreeing_on_a_status_is_a_disagreement` |
| 48 | validator: agrees with a leader that could not answer | `tests/test_direct.py::test_two_formatting_slips_leave_the_round_unchecked` |
| 49 | orders: only the first order is asked | `tests/test_direct.py::test_the_backward_prompt_swaps_the_accounts` |
| 50 | merge: the forward read wins a disagreement | `tests/test_direct.py::test_the_two_orders_disagreeing_on_a_term_store_differ` |
| 51 | merge: a disagreement reads as a match | `tests/test_direct.py::test_the_two_orders_disagreeing_on_a_term_store_differ` |
| 52 | read: an unknown status passes | `tests/test_direct.py::test_two_formatting_slips_leave_the_round_unchecked` |
| 53 | read: no retry on a formatting slip | `tests/test_direct.py::test_a_formatting_slip_is_asked_once_more` |
| 54 | notes: unbounded | `tests/test_direct.py::test_notes_are_one_line_strings_and_cut_short` |
| 55 | verdict: a difference is ignored | `tests/test_direct.py::test_different_names_the_count_and_opens_round_two` |
| 56 | verdict: a missing required term is ignored | `tests/test_direct.py::test_gaps_names_the_missing_required_terms` |
| 57 | verdict: payment is required | `tests/test_direct.py::test_gaps_names_the_missing_required_terms` |
| 58 | verdict: the deadline is optional | `tests/test_direct.py::test_gaps_names_the_missing_required_terms` |
| 59 | check: a third round | `tests/test_direct.py::test_round_two_not_same_page_closes_not_agreed_with_both_deposits_back` |
| 60 | check: round 2 differing keeps the page open | `tests/test_direct.py::test_round_two_not_same_page_closes_not_agreed_with_both_deposits_back` |
| 61 | check: not agreed keeps the deposits | `tests/test_direct.py::test_round_two_not_same_page_closes_not_agreed_with_both_deposits_back` |
| 62 | sign: twice by the opener | `tests/test_direct.py::test_a_side_signs_once_and_strangers_never` |
| 63 | sign: one signature is enough | `tests/test_direct.py::test_both_signatures_make_it_agreed_and_return_both_deposits` |
| 64 | sign: agreed keeps the deposits | `tests/test_direct.py::test_both_signatures_make_it_agreed_and_return_both_deposits` |
| 65 | no_show: before the window closes | `tests/test_direct.py::test_no_show_waits_for_the_window` |
| 66 | no_show: a closed page closes again | `tests/test_direct.py::test_a_closed_page_refuses_everything` |
| 67 | no_show: a missed join pays the opener double | `tests/test_direct.py::test_a_counterparty_who_never_joins_gives_the_opener_their_deposit_back` |
| 68 | no_show: the absent side keeps its deposit | `tests/test_direct.py::test_a_side_that_never_opens_loses_its_deposit_to_the_other` |
| 69 | no_show: the opener is paid for the opener's absence | `tests/test_direct.py::test_a_side_that_never_seals_loses_its_deposit_to_the_other` |
| 70 | no_show: both absent, nobody refunded | `tests/test_direct.py::test_both_absent_each_gets_their_own_back` |
| 71 | no_show: a stalled check keeps the deposits | `tests/test_direct.py::test_a_check_that_never_settles_closes_not_agreed_with_nobody_absent` |
| 72 | no_show: absence is not recorded | `tests/test_direct.py::test_a_side_that_never_seals_loses_its_deposit_to_the_other` |
| 73 | no_show: signing absence read from the seals | `tests/test_direct.py::test_a_side_that_never_signs_loses_its_deposit_to_the_other` |
| 74 | credit: overwrites instead of adding | `tests/test_direct.py::test_withdraw_sums_every_page` |
| 75 | index: the counterparty's list is skipped | `tests/test_direct.py::test_list_pages_by_address_and_everyone` |
| 76 | list: the page size is unbounded | `tests/test_direct.py::test_limits_on_list_pages` |

## Equivalent mutants

Breaks that cannot change behaviour, so no test can catch them. Listed, not dropped.

- **check: a round is checked twice.** check() refuses unless the page is on its CHECK step, and the first verdict always moves the page to SIGN, SEAL (round 2) or DONE, so the `r.verdict != ""` clause in the readiness test can never be the one that refuses.
