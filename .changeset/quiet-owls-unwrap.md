---
'@solana/errors': minor
---

Add an `isSimulationError` type guard and a `SolanaErrorCodeWithSimulationResult` type that identify errors thrown when a transaction simulation fails, refining their context to the simulation result. `unwrapSimulationError` now relies on this guard.
