# Golden results

Contract `0x7c32684fC11c312685188C105D6F08c2B689b720` on Studio Next (chain 61997).

| Case | Expected | Got | Statuses (amount, deliverable, deadline, payment, rights, cancellation) | All six | Check tx |
|---|---|---|---|---|---|
| 1 | SAME_PAGE 0 | SAME_PAGE 0 | MATCH MATCH MATCH MATCH ABSENT ABSENT | yes | [0x1d3028eb](https://explorer-studio-dev.genlayer.com/tx/0x1d3028eb2e100a15560d1df8c6174cd55facfceccd846042482119e333695647) |
| 2 | DIFFERENT 1 | DIFFERENT 1 | DIFFER MATCH MATCH MATCH ABSENT ABSENT | yes | [0x1b78389b](https://explorer-studio-dev.genlayer.com/tx/0x1b78389b951deffb586b25d329ac99dbe9978f390446931d13785010ca68d88c) |
| 3 | DIFFERENT 1 | DIFFERENT 1 | MATCH MATCH MATCH DIFFER ABSENT ABSENT | yes | [0x8dd768be](https://explorer-studio-dev.genlayer.com/tx/0x8dd768befbafd88b923162b331b202b3832bf2edc6c56133a84231c721addc9e) |
| 4 | DIFFERENT 2 | DIFFERENT 2 | ABSENT DIFFER DIFFER ABSENT ABSENT ABSENT | yes | [0x929675a2](https://explorer-studio-dev.genlayer.com/tx/0x929675a25bbc49dabb9f69c399ed97ff9b9312a974d665faa5dafa8cbf57c055) |
| 5 | GAPS 2 | GAPS 2 | ABSENT MATCH ABSENT ABSENT ABSENT ABSENT | yes | [0x1ba0327b](https://explorer-studio-dev.genlayer.com/tx/0x1ba0327bbf7a0de0cd222b39c6ee8f346d302b055dfee8f07970b47943ccc646) |
| 6 | SAME_PAGE 0 | SAME_PAGE 0 | MATCH MATCH MATCH MATCH ABSENT ABSENT | yes | [0xc8a72f60](https://explorer-studio-dev.genlayer.com/tx/0xc8a72f601068d313bcae444983192c3217e803b25aaf2ec12d83a62555cf976d) |
| 7 | DIFFERENT 1 | DIFFERENT 1 | MATCH MATCH MATCH DIFFER ABSENT ABSENT | yes | [0x6e08152a](https://explorer-studio-dev.genlayer.com/tx/0x6e08152a41de05ae3fa48dd208e7abad8784a91c22b6899365323a7834bdc4b7) |
| 8 | DIFFERENT 1 | DIFFERENT 1 | DIFFER MATCH MATCH MATCH ABSENT ABSENT | yes | [0xfe50200c](https://explorer-studio-dev.genlayer.com/tx/0xfe50200c1713f5df86335565d60863ddbff267156c2b6bf28f7b52af85b2cde6) |
| 9 | DIFFERENT 1 | DIFFERENT 1 | MATCH MATCH MATCH MATCH DIFFER ABSENT | yes | [0xbb3991eb](https://explorer-studio-dev.genlayer.com/tx/0xbb3991eba439060fc0aa72a524f7e8be0097c5f24f6000fdacb17d1b6d2a8bd9) |
| H1 | EITHER (held out) | DIFFERENT 1 | MATCH MATCH DIFFER MATCH ABSENT ABSENT |  | [0xb7797e15](https://explorer-studio-dev.genlayer.com/tx/0xb7797e158a61eabe3ac66da59f31d1fec4c82e2fa226fd14fde1205fd06f32bd) |
| H2 | EITHER (held out) | not run |  |  |  |
| H3 | EITHER (held out) | DIFFERENT 1 | MATCH DIFFER MATCH MATCH ABSENT ABSENT |  | [0x25f20b16](https://explorer-studio-dev.genlayer.com/tx/0x25f20b16a25b3477cc9b405cd645e5ac2fd62336b8ab02fbc2083841e5fa8ca6) |

Golden cases matching on all six statuses: **9 of 9**.

## Every check attempt

- case 1 attempt 1: `SAME_PAGE` ([tx](https://explorer-studio-dev.genlayer.com/tx/0x1d3028eb2e100a15560d1df8c6174cd55facfceccd846042482119e333695647))
- case 2 attempt 1: `DIFFERENT 1` ([tx](https://explorer-studio-dev.genlayer.com/tx/0x1b78389b951deffb586b25d329ac99dbe9978f390446931d13785010ca68d88c))
- case 3 attempt 1: `DIFFERENT 1` ([tx](https://explorer-studio-dev.genlayer.com/tx/0x8dd768befbafd88b923162b331b202b3832bf2edc6c56133a84231c721addc9e))
- case 4 attempt 1: `DIFFERENT 2` ([tx](https://explorer-studio-dev.genlayer.com/tx/0x929675a25bbc49dabb9f69c399ed97ff9b9312a974d665faa5dafa8cbf57c055))
- case 5 attempt 1: `GAPS 2` ([tx](https://explorer-studio-dev.genlayer.com/tx/0x1ba0327bbf7a0de0cd222b39c6ee8f346d302b055dfee8f07970b47943ccc646))
- case 6 attempt 1: `SAME_PAGE` ([tx](https://explorer-studio-dev.genlayer.com/tx/0xc8a72f601068d313bcae444983192c3217e803b25aaf2ec12d83a62555cf976d))
- case 7 attempt 1: `DIFFERENT 1` ([tx](https://explorer-studio-dev.genlayer.com/tx/0x6e08152a41de05ae3fa48dd208e7abad8784a91c22b6899365323a7834bdc4b7))
- case 8 attempt 1: `DIFFERENT 1` ([tx](https://explorer-studio-dev.genlayer.com/tx/0xfe50200c1713f5df86335565d60863ddbff267156c2b6bf28f7b52af85b2cde6))
- case 9 attempt 1: `DIFFERENT 1` ([tx](https://explorer-studio-dev.genlayer.com/tx/0xbb3991eba439060fc0aa72a524f7e8be0097c5f24f6000fdacb17d1b6d2a8bd9))
- case H1 attempt 1: `DIFFERENT 1` ([tx](https://explorer-studio-dev.genlayer.com/tx/0xb7797e158a61eabe3ac66da59f31d1fec4c82e2fa226fd14fde1205fd06f32bd))
- case H2 attempt 1: no decision: status=UNDETERMINED execution=FINISHED_WITH_RETURN ([tx](https://explorer-studio-dev.genlayer.com/tx/0x61d17430faaacbbbe6f044a28474c33d6338c0f4493e55c9dab80f3c27575515))
- case H3 attempt 1: `DIFFERENT 1` ([tx](https://explorer-studio-dev.genlayer.com/tx/0x25f20b16a25b3477cc9b405cd645e5ac2fd62336b8ab02fbc2083841e5fa8ca6))
