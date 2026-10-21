# Progress

- 2026-10-21 Read the spec and the rules; started from the Sphinx Studio Next plumbing (seal and reveal, payouts, site, docs).
- 2026-10-21 Contract written: 10 methods, the spec's judge word for word, both orders on every node, verdict in code.
- 2026-10-21 Offline suite green; genvm-lint clean; validated against the live Studio Next runtime.
- 2026-10-21 Deployed to Studio Next at 0x7c32684fC11c312685188C105D6F08c2B689b720; deployed bytes identical to the repo.
- 2026-10-21 Golden set locked (sha256 ef4f3a40…) before the first run; golden run started.
- 2026-10-21 Mutation table: 76 of 76 caught, one equivalent mutant listed.
- 2026-10-21 Site and docs built: landing, open a page, page by step, agreed record, templates, my pages, pages, /docs.
- 2026-10-21 Golden run finished: 9 of 9 golden cases on all six statuses; held-out H1 and H3 decided, H2 undetermined (validators did not agree), published as is.
- 2026-10-21 Seeded: page 14 agreed (DIFFERENT 2 then SAME PAGE, both signed), page 15 refusals on record, page 16 left in round 2, page 1 waiting for its no-show window.
- 2026-10-21 Reviewer path rp1 from fresh accounts through the live faucet and the site's signing code: page 17 agreed, both withdrew; opener reconciled to the wei.
- 2026-10-21 Bug fixed: the faucet paid 20 GEN, exactly a 20 GEN deposit, so a fresh wallet that opened or joined a 20 GEN page was left at 0 GEN (fee deposits are held until finality) and the faucet refused it for 10 minutes: it could not seal. Reproduced on page 18. The faucet now pays 100 GEN and the wallet gate asks for the deposit plus 2 GEN of fee room before a deposit write; verified on page 19 (open, join, both seals straight after funding).
