Kit is developed in public and we encourage and appreciate contributions.

## Getting Started

1. Install dependencies: `pnpm install`
2. The first time you build Kit, you will need to install the Agave test validator, which is used for some tests. `pnpm test:setup`
3. Start a test validator before running tests. `./scripts/start-shared-test-validator.sh`
4. Build + test all packages: `pnpm build`

## Development Environment

Kit is developed as a monorepo using [pnpm](https://pnpm.io/) and [turborepo](https://turborepo.com/).

Often your changes will only apply to a single package. You can run tests for a single package and watch for changes:

```shell
cd packages/accounts
pnpm turbo compile:js compile:typedefs
pnpm dev
```

## A Note on AI-Generated Code

We are supportive of using AI tools to _assist_ your development process (e.g., for boilerplate, optimization suggestions, or debugging).

However, we do not accept "vibe-coded" or purely AI-generated contributions. You must be able to explain, test, and take full ownership of every line of code you submit.

A good rule of thumb is not to use AI to write the PR description. This tends to be less clear and harder to review.

**Pull requests containing code that the author clearly does not understand will be rejected.** You are the developer, not the prompt engineer. All code must be intentional and understood.
