# Phase 6 — Safer full-backup restoration

## Changes

- `applyFullBackup` now creates a deep snapshot of the in-memory claim, provider, contract, tariff, batch, trash, rule, procedure, session, pointer, filter, and settings state before applying a full backup.
- If an exception occurs during import, it restores those lexical application variables, cancels a pending debounced data write, restores the prior `localStorage` key/value set when that snapshot could be read, and refreshes the settings/UI views on a best-effort basis.
- If the pre-import snapshot cannot be created, the import is cancelled before mutation.
- `persistData(true)` now returns `true` on successful persistence and `false` on storage/serialization failure. Full restore treats a failed immediate persistence as an import failure and enters rollback.

## Important limitations

- Browser storage rollback is best-effort. If the browser denies storage access or storage becomes unavailable during rollback, the application cannot guarantee restoration of the previous persisted state.
- Some UI/session side effects (for example closing an open review modal or browser navigation) are not fully transactional. The data collections and local storage are the rollback target; this is not a claim of complete UI atomicity.
- This change does not add a two-phase commit across browser storage and every UI subsystem.
- No contract/clinical rules for partial approval, exclusions, copay, limits, or lab frequency were inferred or changed.

## Verification

- `node --check` was run for every JavaScript file in the project.
- All project JSON files were parsed.
- The generated ZIP archive was checked with `unzip -t`.
- Browser end-to-end/fault-injection tests were not executed in this environment. The existing browser test runner remains the place to add and execute those tests in a real browser.
