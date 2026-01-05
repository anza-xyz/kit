---
'@solana/transaction-messages': major
'@solana/transactions': major
'@solana/signers': major
'@solana/react': major
'@solana/instruction-plans': minor
'@solana/errors': patch
---

Enforce 64-instruction transaction limit across kit

- add instruction-limit types/constants and new error code/message/context
- enforce limit in message append/prepend, compilation, and instruction planning
- propagate instruction-limit typing through transactions, signers, and react
- add unit/typetests for message/transaction limits and sendable checks
