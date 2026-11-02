# TPA Pro – Phase 3 Financial Logic Fixes

## Changes

1. `js/compute-patient.js`
   - Rebuilds generated deduction reasons on each recalculation by removing prior `auto` and `rule` entries while retaining manual entries.
   - Keeps the computed claim approved amount independent of workflow status. A `pending` status no longer zeroes the computed financial amount.
2. `js/claims-view-2.js`
   - When the maximum lab count is exceeded, sorts by line amount ascending and flags the least expensive excess tests, preserving the most expensive tests.
3. `js/engine-fields-2.js`
   - Unknown comparison operators and unknown condition modes now fail closed.
   - Malformed expression/any/all/count conditions and empty bundle/diagnosis configuration fail closed.

## Checks performed

- `node --check` on every JavaScript file under `js/`: passed.
- Targeted Node tests for valid equality, unknown operator, malformed expression, and unknown condition mode: passed.
- ZIP integrity: verified after packaging.

## Important limitations

- No real-browser end-to-end test was run.
- The maximum-labs interpretation assumes the policy is to retain the highest-cost tests and deduct the lowest-cost excess tests. Confirm this against the payer contract/policy before production.
- Claim billed-total reconciliation remains a separate issue: recalculation currently overwrites `claim.billed`, so preserving and comparing the original submitted amount needs a dedicated data-model migration and UI review.
- This phase is not a financial or regulatory certification.
