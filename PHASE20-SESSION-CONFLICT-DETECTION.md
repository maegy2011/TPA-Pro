# Phase 20 — Session / Claim Conflict Detection

## Changes
- Review sessions now capture a `baseClaimSnapshot` the first time they are created. Subsequent saves preserve that baseline rather than replacing it with the working copy.
- Before resuming a session, the application compares the current live claim with the captured baseline.
- If the live claim differs, resume is blocked with a warning. This prevents the existing resume path from overwriting newer claim invoice data with an older session snapshot.
- Sessions created by older versions without a baseline remain resumable for backward compatibility; their conflict state is explicitly `unknown` and is not represented as verified.
- Added regression coverage for unchanged claims, changed claims, and legacy sessions without baselines.

## Important limitations
- The comparison uses a JSON snapshot comparison, not a cryptographic revision or server-side concurrency token. It is suitable as a local stale-session guard, not tamper-proof concurrency control.
- Legacy sessions cannot be reliably conflict-checked because no historical baseline was stored.
- This phase does not implement automatic merge or overwrite. A detected conflict requires manual review and a backup before any future recovery workflow.
- Browser UI integration tests were not executed as part of this phase.
