# ENS Developer Education Series - Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher (comes with Node.js)
- **Git**: Version control system
- **Code Editor**: VS Code recommended with ENS extensions

### Hardware Requirements
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: 2GB free space for curriculum and dependencies
- **Internet**: Stable connection for package downloads

## Installation

### 1. Clone the Repository
```bash
# Clone the curriculum repository
git clone https://github.com/ensdomains/developer-education-series.git

# Navigate to the project directory
cd developer-education-series
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm --version
node --version
```

### 3. Environment Setup

#### Create Environment File
```bash
# Copy environment template
cp .env.example .env
```

#### Configure Environment Variables
Edit `.env` file with your settings:
```env
# Network Configuration
NETWORK=mainnet
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Wallet Configuration (for development)
PRIVATE_KEY=your_private_key_here

# Database Configuration (for advanced modules)
REDIS_URL=redis://localhost:6379

# Logging Configuration
LOG_LEVEL=info
```

## Development Environment

### Local Blockchain (Optional)
For testing without real ETH:
```bash
# Install Ganache CLI
npm install -g ganache-cli

# Start local blockchain
ganache-cli -p 8545

# Use local network in your applications
RPC_URL=http://localhost:8545
```

### Test Networks
For development with test ETH:
```bash
# Goerli Testnet
NETWORK=goerli
RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID

# Sepolia Testnet
NETWORK=sepolia
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

## Wallet Setup

### MetaMask Installation
1. **Install MetaMask Extension**
   - Chrome: [MetaMask Chrome Extension](https://chrome.google.com/webstore/detail/metamask/)
   - Firefox: [MetaMask Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/)

2. **Create or Import Wallet**
   - Create new wallet OR
   - Import existing wallet with seed phrase

3. **Configure Networks**
   - Add Goerli/Sepolia test networks
   - Get test ETH from faucets

### Test ETH Faucets
- **Goerli**: https://goerlifaucet.com/
- **Sepolia**: https://sepoliafaucet.com/

## IDE Setup

### VS Code Extensions
Install these recommended extensions:

#### Essential Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

#### ENS-Specific Extensions
- **ENS Resolver** - Resolve ENS names in editor
- **Solidity** - Smart contract development
- **Hardhat** - Ethereum development environment

### VS Code Settings
Add to your `settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "solidity.compileUsingLocalVersion": true,
  "hardhat.telemetry": false
}
```

## Module-Specific Setup

### Module 01: ENS Fundamentals
```bash
# Navigate to module directory
cd curriculum/modules/01-ens-fundamentals/examples

# Install module dependencies
npm install

# Run basic example
npm start

# Run advanced example
npm run advanced
```

### Module 02: Domain Management
```bash
# Navigate to module directory
cd curriculum/modules/02-domain-management/examples

# Install dependencies
npm install

# Run domain manager
npm start
```

### Module 06: Advanced Integration
```bash
# Navigate to module directory
cd curriculum/modules/06-advanced-integration/examples

# Install production dependencies
npm install

# Run production example
npm start
```

## Testing Setup

### Jest Configuration
Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'curriculum/**/*.js',
    '!curriculum/**/node_modules/**',
    '!curriculum/**/examples/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### Test Setup File
Create `tests/setup.js`:
```javascript
// Global test setup
global.console = {
  ...console,
  // Uncomment to hide logs during testing
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn()
};
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/ens-helpers.test.js
```

## Troubleshooting

### Common Issues

#### 1. Network Connection Issues
```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_RPC_URL
```

#### 2. Dependency Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Wallet Connection Issues
- Ensure MetaMask is unlocked
- Check network selection in MetaMask
- Verify RPC URL in environment variables

#### 4. Gas Estimation Errors
- Check account balance
- Ensure sufficient funds for transaction
- Verify gas price settings

### Getting Help

#### Community Support
- **ENS Discord**: #dev-support channel
- **GitHub Issues**: Report bugs and problems
- **Stack Overflow**: Tag questions with `ethereum` and `ens`

#### Documentation Links
- [ENS Documentation](https://docs.ens.domains/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Hardhat Documentation](https://hardhat.org/docs)

## Advanced Configuration

### Custom Network Setup
```javascript
// custom-networks.js
const customNetworks = {
  local: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://localhost:8545',
    currency: 'ETH'
  },
  custom: {
    chainId: 12345,
    name: 'Custom Network',
    rpcUrl: 'https://custom.rpc.url',
    currency: 'CUST'
  }
};

module.exports = customNetworks;
```

### Logging Configuration
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'ens-app.log' })
  ]
});

module.exports = logger;
```

## Next Steps

### After Setup
1. **Run the Examples**: Test each module's code examples
2. **Join the Community**: Connect with other ENS developers
3. **Start Building**: Begin with Module 01 and progress through the series
4. **Contribute**: Share your improvements and feedback

### Learning Path
1. **Week 1**: Complete Modules 1-2 (ENS Fundamentals)
2. **Week 2**: Complete Modules 3-4 (Advanced Features)
3. **Week 3**: Complete Modules 5-6 (Integration & Deployment)
4. **Week 4**: Build your own ENS-integrated application

---

**Happy Learning! 🎉**

*ENS Developer Education Series - Kenya Edition*
