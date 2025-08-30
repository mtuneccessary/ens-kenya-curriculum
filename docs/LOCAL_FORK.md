# Running the Curriculum on a Local Mainnet Fork

This guide shows how to run every module and example against a local Hardhat node that forks Ethereum mainnet. This gives fast, deterministic, and inexpensive workflows while still interacting with real ENS contracts and data.

## 1) Install Dependencies

```bash
npm install
```

We pin `hardhat@2.26.x` and `ethers@5.x` to match examples.

## 2) Configure Environment

Copy and edit the environment file:

```bash
cp .env.example .env
```

Set:
- `MAINNET_RPC_URL`: an Ethereum mainnet RPC (Alchemy/Infura). The default demo key works for quick tests.
- `PRIVATE_KEY`: a dev key. The default is a Hardhat pre-funded account. Replace with your own if needed.
- `RPC_URL`: defaults to `http://127.0.0.1:8545` (local Hardhat node)

Optional:
- `FORK_BLOCK`: pin to a specific block for reproducibility
- `SEED_NAME`: label to register on the fork (e.g. `kenya-dev-series`)

## 3) Start the Local Fork

```bash
npm run fork:start
```

This launches a Hardhat node that forks mainnet, pre-funds local accounts, and exposes JSON-RPC at `127.0.0.1:8545`.

## 4) Seed ENS Test Data (Optional but Recommended)

With the node running in a separate terminal:

```bash
npm run fork:seed
```

This registers `${SEED_NAME}.eth` on the fork, sets a resolver, address, and a few text records. You can then use that name in examples via `TEST_ENS_NAME` env.

## 5) Run Examples Against the Fork

Each example now reads `RPC_URL` and `PRIVATE_KEY` from `.env` and defaults to the local node.

### Module 01 (ENS Fundamentals)
```bash
cd curriculum/modules/01-ens-fundamentals/examples
npm install
npm run start        # basic ENS interaction (read + optional writes)
npm run advanced     # advanced operations & analysis
```

### Module 02 (Domain Registration & Management)
```bash
cd curriculum/modules/02-domain-management/examples
npm install
npm run start        # commitment/register/renew flows on the fork
```

If you seeded `${SEED_NAME}.eth`, you can use:
```
TEST_ENS_NAME=kenya-dev-series.eth
TEST_DOMAIN_LABEL=my-test-domain
```

## 6) Notes on Using a Fork

- Transactions cost no real ETH; accounts are pre-funded by Hardhat.
- ENS addresses are mainnet addresses, so interactions are realistic.
- You can fast-forward time to test renewals and expirations:

```js
await network.provider.send('evm_increaseTime', [60 * 60 * 24 * 30]); // +30 days
await network.provider.send('evm_mine');
```

- Reset the environment when you want a clean state:

```bash
npm run fork:reset
```

## 7) Troubleshooting

- If the node won’t start, check `MAINNET_RPC_URL` rate limits.
- If examples fail to connect, ensure `RPC_URL` matches the node URL.
- If a write fails with permissions, verify `PRIVATE_KEY` corresponds to the address you expect.

## 8) Where Things Live

- Hardhat config and scripts: `hardhat/`
  - `hardhat.config.ts`: mainnet fork + paths
  - `scripts/00-start-node.sh`: start local node
  - `scripts/01-seed-ens.ts`: seed a test `.eth` name
- Env files: `.env`, `.env.example`
- Example code uses `dotenv` and reads from `process.env`

This setup supports realistic local testing across all modules without leaving your machine.
