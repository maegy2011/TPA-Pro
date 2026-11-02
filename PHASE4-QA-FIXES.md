# TPA Pro — Phase 4 QA and reconciliation fixes

## Implemented
- Preserve the incoming claim amount as `submittedBilled` before recalculation updates `billed`.
- Validate invoice-line totals against `submittedBilled`, rather than the recalculated `billed` amount.
- Return `targetSource` from `validateClaim` to make legacy fallback visible to callers.
- Added regression checks for a submitted amount of 500 versus invoice lines totaling 470.

## Migration caveat
For records first opened after this change, the current `claim.billed` value is captured as `submittedBilled`. If an earlier application version already overwrote the original submitted amount, that original amount cannot be reconstructed from the current record. Those records require reconciliation against the source invoice or external import record. The `legacy-billed` target source indicates that no submitted amount was preserved.

## Verification performed
- JavaScript syntax checks across project JS files.
- JSON parse checks for JSON files.
- ZIP integrity check.

## Not yet verified
- Full browser interaction and UI behavior.
- Business acceptance of the reconciliation tolerance (currently 1 currency unit).
- End-to-end import/export rollback and persistence behavior.
