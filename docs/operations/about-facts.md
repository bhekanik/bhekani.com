# About facts repair

`/about` lists three career facts as definition-list entries: 10 years in software, 7 years building SaaS, and 9 products shipped.

The page previously represented these facts as percentage bars without a stated denominator and included an unqualified “Sleep 28” value. The repair uses plain text values with units and removes the unsupported value. It keeps the existing labels, biography, links, portrait, chips, and origin story unchanged.

Verify the result with `bun run verify:offline`, then inspect `/about` at 390px and 1440px in both themes and both existing editions. The facts should be readable without horizontal overflow or progress-bar semantics.
