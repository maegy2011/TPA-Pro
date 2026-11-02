# Phase 9 — Review finalization reconciliation

## Issue addressed
The final-signoff checklist compared invoice-line totals with `claim.billed`. That field is recalculated from invoice lines and may already have replaced the source-submitted total, making the finalization check unable to detect a mismatch against the original submitted amount.

## Change
- Added `getClaimReconciliationTarget()` in `js/engine-validate.js`.
- The helper uses a valid non-negative `submittedBilled` value when present, otherwise falls back to the legacy `billed` field.
- `validateClaim()` now uses the shared helper.
- The final-signoff checklist in `js/review-bind.js` now compares working invoice lines against the same source-submitted reconciliation target.
- Added regression assertions for submitted amount precedence and invalid-value fallback.

## Validation
- `node --check` passed for all JavaScript files in the project.
- All project JSON files parsed successfully; ZIP integrity checked after packaging.
- Browser execution of the full test suite has not been confirmed.

## Scope note
This change only fixes which amount is used for reconciliation. It does not change contractual benefit rules, reviewer decisions, approval percentages, or workflow status mapping.
