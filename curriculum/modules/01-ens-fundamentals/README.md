# Module 01: ENS Smart Contract Fundamentals

## Overview
This module introduces the core architecture of the Ethereum Name Service (ENS), focusing on the smart contracts that power domain registration, resolution, and management.

## 🎯 Learning Objectives
By the end of this module, participants will:
- Understand the ENS contract architecture
- Interact with ENS Registry and Resolver contracts
- Implement basic name resolution
- Work with ENS token economics

## 📋 Module Outline

### 1.1 ENS Architecture Overview
- **ENS Registry Contract**: The central database mapping names to owners
- **Resolver Contracts**: Handle the actual resolution of names to addresses/resources
- **Registrar Contracts**: Manage domain registration and renewal
- **Contract Relationships**: How the pieces fit together

### 1.2 Core Smart Contracts Deep Dive
- **ENS Registry (`ENS.sol`)**: Owner management and resolver assignment
- **Public Resolver**: Standard resolver for most use cases
- **Base Registrar**: Manages .eth domain registrations
- **Name Wrapper**: Enhanced functionality for wrapped domains

### 1.3 Name Resolution Process
- How ENS resolves names to addresses
- Recursive resolution for subdomains
- Fallback mechanisms
- Resolution caching strategies

### 1.4 ENS Token Economics
- Registration fees and renewal costs
- Gas optimization techniques
- Batch operations for efficiency
- Cost estimation tools

## 🛠 Hands-on Exercises

### Exercise 1.1: Basic Contract Interaction
**Objective:** Connect to ENS contracts on mainnet/testnet
```javascript
// Basic ENS contract interaction example
const { ethers } = require('ethers');

// Connect to Ethereum network
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// ENS Registry contract address
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

// Create contract instance
const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_ABI, provider);
```

### Exercise 1.2: Name Resolution
**Objective:** Resolve ENS names to Ethereum addresses
```javascript
async function resolveENS(name) {
  const resolver = await ensRegistry.resolver(namehash(name));
  const address = await resolver.addr(namehash(name));
  return address;
}
```

### Exercise 1.3: Owner Lookup
**Objective:** Find the owner of an ENS domain
```javascript
async function getOwner(name) {
  const nameHash = namehash(name);
  const owner = await ensRegistry.owner(nameHash);
  return owner;
}
```

## 📚 Key Concepts

### Namehash Algorithm
ENS uses a special hashing algorithm to convert human-readable names into fixed-length identifiers:
```javascript
function namehash(name) {
  if (name === '') return '0x' + '0'.repeat(64);
  
  const labels = name.split('.').reverse();
  let node = '0x' + '0'.repeat(64);
  
  for (const label of labels) {
    node = ethers.utils.keccak256(
      ethers.utils.concat([
        ethers.utils.arrayify(node),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label))
      ])
    );
  }
  
  return node;
}
```

### Contract Addresses (Mainnet)
- **ENS Registry**: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`
- **Public Resolver**: `0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41`
- **Base Registrar**: `0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85`

## 🔍 Workshop Activities

### Activity 1: Contract Exploration
1. Use Etherscan to examine ENS contract source code
2. Identify key functions and events
3. Analyze contract interactions

### Activity 2: Resolution Testing
1. Test name resolution for various domains
2. Handle resolution failures gracefully
3. Implement caching mechanisms

### Activity 3: Gas Analysis
1. Compare gas costs for different operations
2. Optimize contract calls for efficiency
3. Estimate costs for batch operations

## 📖 Additional Resources
- [ENS Documentation](https://docs.ens.domains/)
- [ENS Contract Source Code](https://github.com/ensdomains/ens-contracts)
- [Ethers.js ENS Guide](https://docs.ethers.org/v5/api/utils/ens/)
- [Web3.js ENS Guide](https://web3js.readthedocs.io/en/v1.8.0/web3-eth-ens.html)

## ✅ Module Assessment
**Quiz Questions:**
1. What is the purpose of the ENS Registry contract?
2. How does name resolution work in ENS?
3. What are the gas implications of ENS operations?
4. How do you calculate a namehash?

**Practical Challenge:**
Implement a simple ENS resolver that can:
- Resolve names to addresses
- Handle subdomains
- Provide fallback mechanisms
- Include proper error handling
