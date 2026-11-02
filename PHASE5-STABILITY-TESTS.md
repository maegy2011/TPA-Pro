# Phase 5 — Stability and regression checks

## Changes in this phase

- Fixed stale `validateLine` cache entries: cache identity now includes prior-approval requirement/status/date and the applicable service override. A change from pending to approved (or a changed approval date) therefore triggers fresh validation.
- Fixed stale `validateInvoice` cache entries: the cache identity now includes the invoice document flags, so adding a missing document cannot leave the invoice marked as incomplete from an earlier validation.
- Added regression cases to `tests/tests.js` for pending → approved prior approval, approval dated after the service date, and missing → complete invoice documents.

## Scope and limitations

- The existing test runner loads the seed dataset and browser globals; tests that depend on an available provider/contract/tariff are conditional on the seed data containing them.
- No business rules for coverage limits, beneficiary co-pay, partial approvals, or maximum lab frequency were changed in this phase. Their expected outcomes need to be confirmed against the signed contract/rule configuration before adding deterministic assertions.
- `applyFullBackup` was reviewed. It mutates in-memory collections and settings before all later steps finish, and its catch handler reports an error without restoring a snapshot. This means restoration is not atomic if an exception occurs midway. No speculative rollback was added because settings, sessions, UI state, and persistence have separate side effects; a safe transactional restore needs a dedicated design and fault-injection tests.
- The browser-based runner was attempted with headless Chromium but did not complete within the execution window. Therefore the regression tests are added but are **not reported as executed/passing**.

## Verification performed

- JavaScript syntax checks (`node --check`) for all JavaScript files.
- JSON parsing for all project JSON files.
- ZIP integrity check for the delivered archive.

These checks do not replace end-to-end browser testing or clinical/contract acceptance testing.
