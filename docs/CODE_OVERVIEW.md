# Code Overview

This document explains how the curriculum code is structured and how the examples interact with ENS on a local mainnet fork.

## Repository Layout (Curriculum)

```
curriculum/
├── modules/
│   ├── 01-ens-fundamentals/
│   │   ├── README.md
│   │   └── examples/
│   │       ├── basic-ens-interaction.js
│   │       └── advanced-ens-operations.js
│   ├── 02-domain-management/
│   │   ├── README.md
│   │   ├── workshop-guide.md
│   │   └── examples/
│   │       └── domain-registration-manager.js
│   ├── 03-text-records-content/
│   ├── 04-subdomain-delegation/
│   ├── 05-web3-identity/
│   └── 06-advanced-integration/
├── examples/
│   ├── shared-utilities/ens-helpers.js
│   ├── react-components/ENSDomainInput.jsx
│   └── react-native/ENSMobileManager.js
├── docs/
│   ├── LOCAL_FORK.md
│   └── CODE_OVERVIEW.md
└── workshops/, resources/
```

## Local Fork Tooling

We use Hardhat to run a local fork of Ethereum mainnet:

- `hardhat/hardhat.config.ts` configures the fork using `MAINNET_RPC_URL` and optional `FORK_BLOCK`.
- `npm run fork:start` starts the node.
- `npm run fork:seed` registers a test `.eth` and sets resolver/text records so examples have realistic data.

## Environment Variables

All examples are wired to use `.env` via `dotenv` and default to the local node.

- `RPC_URL`: JSON-RPC endpoint (defaults to `http://127.0.0.1:8545`)
- `PRIVATE_KEY`: account used for write operations
- `TEST_ENS_NAME`: convenient way to point examples to your seeded name (e.g. `kenya-dev-series.eth`)

## Example Highlights

### Module 01
- `basic-ens-interaction.js`
  - Reads/writes through `ENS Registry` and `Public Resolver`
  - Functions: owner lookup, resolver lookup, addr/text reads, optional writes
- `advanced-ens-operations.js`
  - Batch resolution, name analysis, and gas estimation helpers

### Module 02
- `domain-registration-manager.js`
  - Full `.eth` lifecycle: availability, commitment, register, renew, info, and bulk helpers
  - On a fork, registration is fast and inexpensive (no real ETH)

### Shared Utilities
- `examples/shared-utilities/ens-helpers.js`
  - `namehash`, ENS validation, content hash helpers
  - Network address helpers for mainnet/testnets

## How the Examples Connect

- Each file creates an `ethers.providers.JsonRpcProvider` using `RPC_URL`.
- For write operations, the examples build a `new ethers.Wallet(PRIVATE_KEY, provider)`.
- Contract instances point at the mainnet ENS addresses; because we fork mainnet, these addresses exist locally.

## Testing Notes

- Use `npm run fork:seed` to get a working name you own on the fork.
- You can tweak `SEED_NAME` and re-run the seeding.
- For renewal-expiration tests, advance time using Hardhat JSON-RPC methods.

## Extending

- Add your own scripts under `hardhat/scripts/`.
- Use the shared utilities to stay consistent across modules.
- If you need additional contracts, add them under `hardhat/contracts/` and deploy in a script.

---

This overview is intended to be straight to the point so you can move quickly from reading to building. If anything looks off, open an issue or drop a note in the workshop channel.
