---
name: Production release verification
description: How to confirm publishing actually replaced the live frontend release.
---

Do not treat a reported successful publish as proof that the live frontend changed. Compare the deployed HTML asset hash with the newly built asset and check deployment restart timestamps before asking users to retry.

**Why:** Multiple reported successful publishes left production serving the previous JavaScript bundle, which preserved a browser-startup crash even though the corrected local build was clean.

**How to apply:** After frontend production fixes, record the local build asset name, publish, then fetch the production HTML and confirm it references the new asset before running user-facing checks.