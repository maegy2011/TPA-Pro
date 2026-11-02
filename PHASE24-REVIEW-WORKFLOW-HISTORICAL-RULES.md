# PHASE 24 — Review workflow, historical rules, retirement age, and archive

## Implemented in this build

### Review workflow
- Review exceptions and the legal deduction breakdown are scoped to the currently selected patient inside the active invoice.
- The final save gate scans every patient in every invoice, so a pending exception on a different patient cannot be bypassed by saving the currently selected patient.
- Review edits snapshot the working copy into the work-session store after a short debounce. The live claim is not overwritten until the reviewer saves the review.
- Session snapshots retain the current invoice/patient position and can be resumed.

### Retirement age
- Added an editable annual retirement-age schedule under Settings. The initial schedule is 2026 = 60 and 2027 = 61; future years can be added/edited.
- Egyptian national ID parsing validates the 14 digits' date-of-birth segment, including calendar validity. Century digit 2 maps to 1900 and 3 maps to 2000.
- Age is also recorded at the letter start date (`letterStartDate`, `startDate`, or claim date fallback), while the binding employee/retiree classification for each line is resolved using the procedure date (`procedureDate`, `serviceDate`, or line `date`); invoice date is the fallback. Review date is never used.
- Each reviewed line stores the resolved procedure date, age, and employee/retiree classification for traceability.
- Prior-approval rejection for retiree-only lines uses the line's procedure-date classification.
- Invalid national IDs do not silently create a birth date; existing beneficiary type is retained as a fallback.

### Historical financial application
- Contract context now accepts an effective date and is resolved using the service/procedure date.
- Contract discount versions are stored in `rateVersions` with effective-from/effective-to dates. The contract editor includes a date for the new financial version; the prior version is closed the day before the new one begins.
- Tariff service prices are resolved from the tariff version effective on the procedure date rather than reading the latest current price.
- Existing tariff version history and deduction-rule effective dates continue to be applied.
- Date ranges are inclusive at both ends. Avoid overlapping versions; when overlap exists, the most recently effective version wins.

### Archive / read-only
- Added an explicit “Close claim and archive” action after a review has been saved.
- Archiving is confirmed, audited, persisted, and marks the claim `archived` / `read-only`.
- Archived claims appear in a dedicated Archived Claims filter. They have no review, add-memo, delete, or bulk-selection controls.
- Opening an archived claim in review redirects to its timeline/read-only view.

## Operating model
- This application is designed for one reviewer. No multi-user locks, collaboration, or cross-user conflict resolution are introduced.
- A reviewer may correct any review decision and reverse an erroneous deduction while the claim is not archived.
- Archiving is the final, irreversible application-level lock. There is no reopen/unarchive action in this phase.

## Important validation notes
- The retirement schedule is policy data and must be updated by the reviewer when the official annual threshold changes.
- For a patient with services spanning a retirement birthday or multiple procedure dates, line-level classification is stored per service. Patient-level caps/copays still operate on the invoice/patient aggregate using the invoice reference date; a future enhancement should split patient-level rules across line dates if the governing contract requires day-level proration.
- A national ID is sensitive personal data. The app derives only the date of birth and does not send it to an external service.
- Tariff versioning already existed; this phase changes the calculation to use the effective historical version. Contract rate versioning is newly added.
- Archived status is enforced by the UI workflow. Because this is a browser-local application, users with direct developer-tools access can still alter local browser storage; this is not a server-enforced legal records vault.

## Smoke checks
- JavaScript syntax checked for every `js/*.js` file.
- Retirement helper checks cover 1900/2000 century parsing, invalid calendar dates, birthday boundary calculation, and 2026/2027 annual retirement thresholds.
