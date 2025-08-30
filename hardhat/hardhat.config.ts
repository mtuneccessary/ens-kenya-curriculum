import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: process.cwd() + "/.env" });

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo";
const FORK_BLOCK = process.env.FORK_BLOCK ? parseInt(process.env.FORK_BLOCK) : undefined;
const ACCOUNTS = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.23",
		settings: {
			optimizer: { enabled: true, runs: 200 }
		}
	},
	networks: {
		// Local Hardhat network (mainnet fork)
		hardhat: {
			chainId: 31337,
			forking: {
				url: MAINNET_RPC_URL,
				blockNumber: FORK_BLOCK
			},
			accounts: {
				accountsBalance: "100000000000000000000" // 100 ETH
			}
		},
		localhost: {
			url: "http://127.0.0.1:8545",
			chainId: 31337
		}
	},
	paths: {
		root: process.cwd() + "/hardhat",
		sources: process.cwd() + "/hardhat/contracts",
		tests: process.cwd() + "/hardhat/test",
		cache: process.cwd() + "/hardhat/cache",
		artifacts: process.cwd() + "/hardhat/artifacts"
	}
};

export default config;
