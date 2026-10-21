# Evidence

Every link was opened by `python submission/check-links.py submission/evidence.md`: each transaction exists on the Studio
Next explorer and is ACCEPTED or FINALIZED. "Refused" rows are refusals stored as refusals: the contract said no, kept
nothing, and the sentence is in the transaction's result.

## The contract

- Contract: https://explorer-studio-dev.genlayer.com/address/0x7c32684fC11c312685188C105D6F08c2B689b720
- Deploy: https://explorer-studio-dev.genlayer.com/tx/0x01c1460f82343e19817c2cedd5622913a21f2ab552f674d2a13b8d6c31b72b2e
- Deployed bytes identical to `contracts/samepage.py` (sha256 fbc5e9ac…b28d43): `python scripts/verify.py`
- Live site: https://usesamepage.vercel.app
- Repository: https://github.com/meitipro1/samepage

## Golden cases through real consensus (9 of 9 on all six statuses)

- Case 1 (The base deal, worded differently on each side): SAME_PAGE 0 [M M M M A A], page 2: https://explorer-studio-dev.genlayer.com/tx/0x1d3028eb2e100a15560d1df8c6174cd55facfceccd846042482119e333695647
- Case 2 (600 USDC against 600 USDT): DIFFERENT 1 [D M M M A A], page 3: https://explorer-studio-dev.genlayer.com/tx/0x1b78389b951deffb586b25d329ac99dbe9978f390446931d13785010ca68d88c
- Case 3 (Half upfront against paid after delivery): DIFFERENT 1 [M M M D A A], page 4: https://explorer-studio-dev.genlayer.com/tx/0x8dd768befbafd88b923162b331b202b3832bf2edc6c56133a84231c721addc9e
- Case 4 (Logo with source files by Friday against logo PNGs by Oct 16): DIFFERENT 2 [A D D A A A], page 5: https://explorer-studio-dev.genlayer.com/tx/0x929675a25bbc49dabb9f69c399ed97ff9b9312a974d665faa5dafa8cbf57c055
- Case 5 (A logo with no price and no date): GAPS 2 [A M A A A A], page 6: https://explorer-studio-dev.genlayer.com/tx/0x1ba0327bbf7a0de0cd222b39c6ee8f346d302b055dfee8f07970b47943ccc646
- Case 6 (The base deal, in Persian against English): SAME_PAGE 0 [M M M M A A], page 7: https://explorer-studio-dev.genlayer.com/tx/0xc8a72f601068d313bcae444983192c3217e803b25aaf2ec12d83a62555cf976d
- Case 7 (Payment "as discussed" against paid after delivery): DIFFERENT 1 [M M M D A A], page 8: https://explorer-studio-dev.genlayer.com/tx/0x6e08152a41de05ae3fa48dd208e7abad8784a91c22b6899365323a7834bdc4b7
- Case 8 (700 USDC, plus an instruction to the checker): DIFFERENT 1 [D M M M A A], page 9: https://explorer-studio-dev.genlayer.com/tx/0xfe50200c1713f5df86335565d60863ddbff267156c2b6bf28f7b52af85b2cde6
- Case 9 (Only one side says Kiln may repost): DIFFERENT 1 [M M M M D A], page 10: https://explorer-studio-dev.genlayer.com/tx/0xbb3991eba439060fc0aa72a524f7e8be0097c5f24f6000fdacb17d1b6d2a8bd9
- Case H1 (By the end of the week against by Friday): DIFFERENT 1 [M M D M A A], page 11: https://explorer-studio-dev.genlayer.com/tx/0xb7797e158a61eabe3ac66da59f31d1fec4c82e2fa226fd14fde1205fd06f32bd
- Case H2 (Around 600 USDC against 600 USDC): no decision, validators did not agree (UNDETERMINED), page 12: https://explorer-studio-dev.genlayer.com/tx/0x61d17430faaacbbbe6f044a28474c33d6338c0f4493e55c9dab80f3c27575515
- Case H3 (A thread against a long post): DIFFERENT 1 [M D M M A A], page 13: https://explorer-studio-dev.genlayer.com/tx/0x25f20b16a25b3477cc9b405cd645e5ac2fd62336b8ab02fbc2083841e5fa8ca6

Statuses in term order (amount, deliverable, deadline, payment, rights, cancellation): M match, D differ, A absent.

## Page 14, the spec's story: Different · 2, then Same page, both sign

- Page: https://usesamepage.vercel.app/p/14 (record: https://usesamepage.vercel.app/p/14/record)
- Kiln opens "Kiln launch posts" naming Sera → `14`: https://explorer-studio-dev.genlayer.com/tx/0xe8518b433ee3d40878ad70d79579fc9526f6b77d5a52e944f3f325697d673df3
- Sera joins with the 20 GEN deposit → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0x5b82c3c29675115b14b42b4bd66237415b84ba259523cd58f6a0e01d69cbb5f1
- kiln_r1 seals → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0xb879335e035283195169e1e9d20ca9b5b3bb6035031687df03bb38031c395825
- sera_r1 seals → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0x2fbcd355831cc14e199cd579b8ed772d7073288b2f9f6f69a6ca65933248913b
- kiln_r1 opens → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0xc11d44074e89d65264122ac4df3c69c9c4c1e8d60dec59b63ed0d7c1f5cec2f3
- sera_r1 opens → `CHECK`: https://explorer-studio-dev.genlayer.com/tx/0x38d93c81109bdddcb0d3062ad9fe4ef87d75dca5edb6ef135c3ea9642d9bc981
- round 1 check, attempt 1 → `DIFFERENT 2`: https://explorer-studio-dev.genlayer.com/tx/0x3063fcf4a671cc25a4c3f43d2173e5003e09289ec2470a3782f3eb995fce7d47
- kiln_r2 seals → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0x6d6ef632d230662bcf4e26dcb69952882b1c1d2b1379ef0f8479ce5dff10d1ab
- sera_r2 seals → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0x85c7dc2f5b176122b0e1d00be04044dc1fa4ae0afd56c0701b71b1c35728167c
- kiln_r2 opens → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0x25b7c0b6ca43aa3015bacedcca84e7a867187588809517de627a592d82cc8280
- sera_r2 opens → `CHECK`: https://explorer-studio-dev.genlayer.com/tx/0x8d63fa72839d47979d4ddad89971b3f57681310dc59c76c4fe42d44543616497
- round 2 check, attempt 1 → `SAME_PAGE`: https://explorer-studio-dev.genlayer.com/tx/0x622ed27fd0ba7806066f47ecfc826eca4581bb8d260133e22d7e9feea5762486
- Kiln signs → `SIGN`: https://explorer-studio-dev.genlayer.com/tx/0xd2027d87850c8aeaa9bbc32ddf2738c1a47c724524659ae0d8fdb2ac4de814ec
- Sera signs → `AGREED`: https://explorer-studio-dev.genlayer.com/tx/0xe5ab82f3fe22cd2689329bada28c062e026a6ea5a0982a92c9d491656aac34d7

## Page 15, refusals on record

- Page: https://usesamepage.vercel.app/p/15
- Kiln opens "Kiln thread, refusals on record" naming Sera → `15`: https://explorer-studio-dev.genlayer.com/tx/0xbd226fa1e89bfcfba7b4426d79a0cb267d37d4466e08e07c4f151a2f6fd29c47
- Refused, a stranger tries to join → "only the counterparty named on this page may join it": https://explorer-studio-dev.genlayer.com/tx/0x224f54bf16b8e45b83649f162125c76db35070a31fce7dd3cf2fdbbdd0c9e6b6
- Refused, Sera joins with the wrong deposit → "send exactly the deposit, 5000000000000000000 wei": https://explorer-studio-dev.genlayer.com/tx/0x3aa910a0d473eceb908f81b1328ab9528635c83889f65dce5e7d88e0720d01fc
- Sera joins → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0x6cef06f1d0960c9ee6598ad19fc497a63117902e0f6c0772cd49090a154a6a66
- kiln seals → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0xb639c2970abd2078fe0b2e9935ced11d8463f5402ae38c9ffbdf00052dac6c5e
- Refused, Kiln tries to open before Sera has sealed → "accounts open only after both sides have sealed": https://explorer-studio-dev.genlayer.com/tx/0x5a9761e0adaebe50738d76dce59de2c4d8c9807f3a8667a200404347d126845d
- Sera seals a copy of Kiln's seal → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0x107d414c43c16ddf9beb07da49856039649c8569a0edd2a50f0743ee61377616
- Refused, Sera tries to open Kiln's text with Kiln's salt → "this text and salt do not match this side's seal": https://explorer-studio-dev.genlayer.com/tx/0xcd03a29ecaa992b21464b0a0d9d7214667927750135f421ec4b4e2552c0bcb49
- kiln opens → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0xccf79e0e0a5c5e699f00f3accf54a5e99e0f4f09496b6779dcd56238940607cf
- Refused, a stranger tries to sign → "only the two sides of this page may do that": https://explorer-studio-dev.genlayer.com/tx/0x47468b78c74577da29723abf1ff626237aeb75272cf3b50afebc512f7595eb97
- Refused, a stranger tries no_show before the window closes → "the window for this step is still open": https://explorer-studio-dev.genlayer.com/tx/0xb4997462d152b38202ab8c8bdc9fbea94f366cc1049d234d07170a25ea248c31
- Refused, a stranger tries to withdraw → "nothing to withdraw for this address": https://explorer-studio-dev.genlayer.com/tx/0x56f5380b9223d0c15df66489c8ffb2922589574dad12918bfe1819438184340f

## Page 16, left in round 2

- Page: https://usesamepage.vercel.app/p/16
- Kiln opens "Kiln ambassador, November" naming Sera → `16`: https://explorer-studio-dev.genlayer.com/tx/0x46d78d442e1f2ae5fe03b45db9f621c743fa28e30dc08e0f3308d5d51cdf659d
- Sera joins → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0x667a11eb431e4b09246a58930ab0aa6cabba95458bd22c377b1d1f4589c21fa5
- kiln_r1 seals → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0xc646d72317847ff069867682298e75b16e568ad90fa84242cce304675dc2900c
- sera_r1 seals → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0x180501f866112a907f1db7401302a6ef36ad479d37576e22268c7950f3d61b6d
- kiln_r1 opens → `REVEAL`: https://explorer-studio-dev.genlayer.com/tx/0x6d7e9ece1b0a906d9007f72da642f18e024bb84ac34f1230effe229d41cb4928
- sera_r1 opens → `CHECK`: https://explorer-studio-dev.genlayer.com/tx/0xa9c18677b56a1e752e98a8af626fdd377eb4a9a27a071da507233fa59237a00c
- round 1 check, attempt 1 → `DIFFERENT 2`: https://explorer-studio-dev.genlayer.com/tx/0xbd6606f9c791c75a9b2dee54e8395fcf8d9cc3b67c594417f5a561292e85c63d
- kiln_r2 seals → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0x18c9680ce79819a6f988f10d8a9aac26b42dff9f934bdfea5073b435029e203d

## Page 1, the no-show path

- Page: https://usesamepage.vercel.app/p/1
- Kiln opens "Kiln logo, PNG and SVG" naming Sera → `1`: https://explorer-studio-dev.genlayer.com/tx/0x921d933a8dbcc12335eee0d2d3049d5fa60169fe6e8bedc0208192b966f8384a
- Sera joins with the deposit → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0x8114eed26d6961fa8b210cbad153a5ecf192258be3b66ff4b9ab1540e78986fe
- kiln seals → `SEAL`: https://explorer-studio-dev.genlayer.com/tx/0x611e66d419a782d599b7ceaef3336222bbd3661f9a83fb15dc9c8d9ec73aeb2b

## Withdrawals after finality

- seed_kiln withdraws 20 GEN → `20000000000000000000`: https://explorer-studio-dev.genlayer.com/tx/0x0cab5182ce1833070f78ffe76eb73aa17a2f8d5c1b0c178ef5f6b0fc0e885400
- seed_sera withdraws 20 GEN → `20000000000000000000`: https://explorer-studio-dev.genlayer.com/tx/0x21e4e16f1aab165f652629901193c8b59957114895a7a6a2b9aff16dbd74df99

## Reviewer path from fresh wallets, through the live site (page 17)

Two accounts that had never touched the contract, funded by the live site's faucet route, every write sent through
`web/lib/genlayer-core.mjs` (the file the browser runs) with a stand-in EIP-1193 wallet.

- Page: https://usesamepage.vercel.app/p/17 (record: https://usesamepage.vercel.app/p/17/record)
- open: https://explorer-studio-dev.genlayer.com/tx/0xb13c2082d5315d41970662cb7998d0fae5dcf83879eb1f3aee2f6e5d0c8bd890
- Refused, join-wrong-deposit: https://explorer-studio-dev.genlayer.com/tx/0x17c5f973b1606fd1b92e361e21e2d0b7dea5f1dfc12718430342abe6dab2e629
- join: https://explorer-studio-dev.genlayer.com/tx/0xaa261b7274386599d04f3de6bdf5ecb0a93c78967db563edc40c621d31e5fabb
- seal-opener_r1: https://explorer-studio-dev.genlayer.com/tx/0x4270076db9b788b3e6aa9b190d8401855bb516afab8f1bde744d4a33d48f867a
- Refused, open-before-both-sealed: https://explorer-studio-dev.genlayer.com/tx/0x6c23cc3d1041ae6532190dcb9201a56f511b7fee24cd84ce9028b00f00167a52
- seal-counterparty_r1: https://explorer-studio-dev.genlayer.com/tx/0xfca1eff5e8060729a4cbfe35547071d20e295d0a7794fbf969e87672d7c33405
- reveal-opener_r1: https://explorer-studio-dev.genlayer.com/tx/0x44bb07dfcf0258c0c3a038595873b1f3a3b081031dd26132e57c37f28d2dde8a
- reveal-counterparty_r1: https://explorer-studio-dev.genlayer.com/tx/0x24771007235b1fee6bb7dd4c1d3569ba10e1afd671542fe87a4918aef2a37235
- check-r1-1: https://explorer-studio-dev.genlayer.com/tx/0x5cdbdda2c77e02ffa5373982a1219f61cd0eee26f3fd92c696a59fcbb50ed4f1
- seal-opener_r2: https://explorer-studio-dev.genlayer.com/tx/0xc7c69b69e93ec8974ba94199f3e1a0f20139c85c2b56eee7f7f516319102f9d4
- seal-counterparty_r2: https://explorer-studio-dev.genlayer.com/tx/0x503eb503583a3b9c93132979d40a6a95e541082060f7808d1c6a2eb36b4328f1
- reveal-opener_r2: https://explorer-studio-dev.genlayer.com/tx/0x2f17e435dbdd128d170e140cb87477a5bba16c5af5789166c040ba7288f4862d
- reveal-counterparty_r2: https://explorer-studio-dev.genlayer.com/tx/0xa7f77a4c5b7cb9eb885a8c3bd428d3f91a4d4c88b7e28fe37164c981afd78ecb
- check-r2-1: https://explorer-studio-dev.genlayer.com/tx/0x9f98bdbac7249c929fc8efc57197c852d34ff2ebd9d92167f482578d17ce4e49
- sign-opener: https://explorer-studio-dev.genlayer.com/tx/0x7afb1faf8e73dd8ba4424af767591882a0114ff47b5540095c2a99b365b5f590
- sign-counterparty: https://explorer-studio-dev.genlayer.com/tx/0xe03dd29930592ffdb45e076fdaa3981fb6a58d0a17e7c2c80f6261c1f4076f48
- withdraw-opener: https://explorer-studio-dev.genlayer.com/tx/0x4d47fc65008ff5038a7ceac382cf2f818ca12b367f32dc5af6cd0b5a94edfa6e
- withdraw-counterparty: https://explorer-studio-dev.genlayer.com/tx/0xa8f870d41650d9e35402847be3f60013f54ffc51ce503222bcb18769fe835cff

Balances after finality: the opener's balance equals the faucet amount minus every value kept and every net fee, plus the withdrawal, to the wei (difference 0 wei). The counterparty's balance is 0.100000000000033881 GEN higher than that sum: exactly the second 0.0500000000000169 GEN fee deposit the explorer records on each of its two `check` transactions (three rotations allowed), and the wallet's balance moved as if that second deposit was never charged. Reported as measured, not explained away.

## Bug found and fixed while testing

- The faucet paid 20 GEN, exactly the default deposit; fee deposits are held until finality, so a fresh wallet that opened a 20 GEN page was left at 0 GEN and the faucet refused it for ten minutes. Reproduced on page 18: https://usesamepage.vercel.app/p/18
- Fixed (faucet pays 100 GEN; the wallet gate asks for the deposit plus fee room first) and verified on page 19, where both fresh wallets opened, joined and sealed straight after funding: https://usesamepage.vercel.app/p/19
