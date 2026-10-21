# Portal entry

Every field below is pasted as is. `python submission/count.py` counts each one exactly as it will be pasted, and
`python submission/check-links.py` opens every link once. Icon: `submission/samepage-icon-512.png` (512 × 512, the
site's own mark, safe for a circular crop).

## Make it recognizable

<!-- name -->
Samepage
<!-- end -->

- **Primary tag:** Dispute Resolution
- **Tag 1 / Tag 2:** pick the nearest from the portal's lists, in this order of preference: Agreement / Deal Check,
  Freelance / Creator Deals, Escrow / Deposits

## One-liner

<!-- one-liner -->
Two accounts of one deal, compared on six terms by validators before anyone signs.
<!-- end -->

## Description

<!-- description -->
Samepage checks a deal before the work starts. Both sides, say a project and a creator, write the deal in their own words and seal a hash of it, so neither can copy or adjust to the other. Once both open, GenLayer validators compare the two accounts on six terms: amount, deliverable, deadline, payment, rights and cancellation. Each validator asks in both orders and they must agree on all six MATCH/DIFFER/ABSENT statuses; the verdict is computed in code: SAME PAGE, DIFFERENT with the terms named, or GAPS. On a difference both rewrite once; on the same page both sign a record holding both texts. A good-faith deposit from each side comes back when they sign, or when two honest rounds still differ, and goes to the other side if one walks away. Deployed on Studio Next; 9 of 9 golden cases matched on all six statuses through real consensus, with the held-out results published as they came out.
<!-- end -->

## Show it in action

Video: record with `submission/demo-script.md` and paste the link (optional field).

## Write the exact path

<!-- step 1 -->
**Fund two wallets** — Open usesamepage.vercel.app with wallet A and select Connect wallet, then Switch network and Get test GEN (100 test GEN, free). Do the same in a second browser profile with wallet B.
<!-- end -->

<!-- step 2 -->
**Open a page** — With wallet A select Open a page, choose the Paid promotion template, keep the title, paste wallet B's address, set the deposit to 20 and the window to 6, select Open the page and confirm. Send the page link to wallet B.
<!-- end -->

<!-- step 3 -->
**Join and seal** — With wallet B open the link and select Join with 20 GEN. Each wallet then writes the deal in its own words, one saying all 600 USDC is paid after the last post, the other half before and half after, and selects Seal my account.
<!-- end -->

<!-- step 4 -->
**Open and check** — Both wallets select Open my account. Then either selects Check round 1 and waits about a minute while validators compare: the page shows Different, with payment hatched and both sides' words side by side.
<!-- end -->

<!-- step 5 -->
**Round 2 and sign** — Both write round 2 with the same payment terms, seal, open, and select Check round 2: Same page. Both select Sign the record, then Withdraw on My pages: each wallet gets its 20 GEN deposit back.
<!-- end -->

## Prove the path works

<!-- proof -->
The page ends Agreed, with the record at /p/[id]/record. Read it back: get_page(id) returns status AGREED, round 1 verdict DIFFERENT with payment DIFFER, round 2 SAME_PAGE, both signed, both payouts 20 GEN. Seeded run, page 14: https://explorer-studio-dev.genlayer.com/tx/0x3063fcf4a671cc25a4c3f43d2173e5003e09289ec2470a3782f3eb995fce7d47 (DIFFERENT 2), https://explorer-studio-dev.genlayer.com/tx/0x622ed27fd0ba7806066f47ecfc826eca4581bb8d260133e22d7e9feea5762486 (SAME_PAGE).
<!-- end -->

- **Contract (Studio Next):** https://explorer-studio-dev.genlayer.com/address/0x7c32684fC11c312685188C105D6F08c2B689b720

## Send people to it

- **Website:** https://usesamepage.vercel.app
- **GitHub:** https://github.com/meitipro1/samepage

## Steward note

<!-- steward -->
Samepage is on Studio Next at 0x7c32…b720; the deployed bytes match contracts/samepage.py (scripts/verify.py). Validators compare six statuses exactly, each asked in both orders; the verdict is code. Golden set 9 of 9 on all six statuses; held-out H2 ("around 600 USDC") reached no decision and is published as such. 160 offline tests, 76 of 76 mutants caught. Open a fresh page to try it: seeded pages may be mid-window. Evidence: submission/evidence.md.
<!-- end -->
