const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Minimal config for local fork; toolbox is not required

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
const FORK_BLOCK = process.env.FORK_BLOCK ? parseInt(process.env.FORK_BLOCK) : undefined;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		version: '0.8.23',
		settings: {
			optimizer: { enabled: true, runs: 200 }
		}
	},
	networks: {
		hardhat: {
			chainId: 31337,
			forking: {
				url: MAINNET_RPC_URL,
				blockNumber: FORK_BLOCK
			},
			accounts: {
				accountsBalance: '100000000000000000000'
			}
		},
		localhost: {
			url: 'http://127.0.0.1:8545',
			chainId: 31337
		}
	},
	paths: {
		root: process.cwd() + '/hardhat',
		sources: process.cwd() + '/hardhat/contracts',
		tests: process.cwd() + '/hardhat/test',
		cache: process.cwd() + '/hardhat/cache',
		artifacts: process.cwd() + '/hardhat/artifacts'
	}
}; 