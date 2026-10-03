# Domain contracts

This directory is the canonical contract layer for business domains.

## Rules

- **types/** contains stable domain vocabulary and state machines.
- **schemas/** contains runtime validation with Zod. External input must be validated before entering a domain command.
- **commands/** contains command input and handler contracts. Implementations belong to the application/server layer and must depend on these contracts, not redefine them.
- **read-models/** contains stable read-facing projections. UI/API consumers should prefer these over persistence models.
- **events/** contains integration events and their payload contracts. Event names are versionable API contracts.

The first-class domains are: accounts, transfers, customers, onboarding, notifications, documents, statements, and security.

Cross-domain features such as funding, KYC, support, admin, transactions, and beneficiaries should consume these contracts where applicable instead of creating parallel customer/account/notification/document representations.

Keep persistence adapters and Supabase-generated database types outside this layer. Database rows are implementation details; domain contracts are application-facing agreements.
