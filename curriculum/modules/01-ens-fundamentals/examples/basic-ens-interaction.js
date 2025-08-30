require('dotenv').config();
// ENS Fundamentals - Basic Contract Interaction
// This example demonstrates basic interaction with ENS smart contracts

const { ethers } = require('ethers');

// ENS Contract Addresses (Mainnet)
const ENS_ADDRESSES = {
  REGISTRY: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  PUBLIC_RESOLVER: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
};

// ENS Registry ABI (simplified for demonstration)
const ENS_REGISTRY_ABI = [
  'function owner(bytes32 node) view returns (address)',
  'function resolver(bytes32 node) view returns (address)',
  'function setOwner(bytes32 node, address owner)',
  'function setResolver(bytes32 node, address resolver)',
  'function setSubnodeOwner(bytes32 node, bytes32 label, address owner)'
];

// Public Resolver ABI (simplified)
const PUBLIC_RESOLVER_ABI = [
  'function addr(bytes32 node) view returns (address)',
  'function setAddr(bytes32 node, address addr)',
  'function text(bytes32 node, string key) view returns (string)',
  'function setText(bytes32 node, string key, string value)'
];

class ENSInteraction {
  constructor(providerUrl, privateKey = null) {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl || (process.env.RPC_URL || 'http://127.0.0.1:8545'));
    
    if (privateKey || process.env.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(privateKey || process.env.PRIVATE_KEY, this.provider);
    }
    
    // Initialize contract instances
    this.registry = new ethers.Contract(
      ENS_ADDRESSES.REGISTRY,
      ENS_REGISTRY_ABI,
      (privateKey || process.env.PRIVATE_KEY) ? this.signer : this.provider
    );
    
    this.resolver = new ethers.Contract(
      ENS_ADDRESSES.PUBLIC_RESOLVER,
      PUBLIC_RESOLVER_ABI,
      (privateKey || process.env.PRIVATE_KEY) ? this.signer : this.provider
    );
  }

  // Convert ENS name to namehash
  namehash(name) {
    if (name === '') return ethers.constants.HashZero;
    
    const labels = name.split('.').reverse();
    let node = ethers.constants.HashZero;
    
    for (const label of labels) {
      node = ethers.utils.keccak256(
        ethers.utils.concat([
          node,
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label))
        ])
      );
    }
    
    return node;
  }

  // Get owner of an ENS name
  async getOwner(name) {
    try {
      const nameHash = this.namehash(name);
      const owner = await this.registry.owner(nameHash);
      return owner;
    } catch (error) {
      console.error('Error getting owner:', error);
      throw error;
    }
  }

  // Get resolver for an ENS name
  async getResolver(name) {
    try {
      const nameHash = this.namehash(name);
      const resolver = await this.registry.resolver(nameHash);
      return resolver;
    } catch (error) {
      console.error('Error getting resolver:', error);
      throw error;
    }
  }

  // Resolve ENS name to Ethereum address
  async resolveAddress(name) {
    try {
      const nameHash = this.namehash(name);
      const address = await this.resolver.addr(nameHash);
      return address;
    } catch (error) {
      console.error('Error resolving address:', error);
      throw error;
    }
  }

  // Get text record from ENS name
  async getTextRecord(name, key) {
    try {
      const nameHash = this.namehash(name);
      const text = await this.resolver.text(nameHash, key);
      return text;
    } catch (error) {
      console.error('Error getting text record:', error);
      throw error;
    }
  }

  // Set address for ENS name (requires ownership)
  async setAddress(name, address) {
    if (!this.signer) {
      throw new Error('Private key required for write operations');
    }

    try {
      const nameHash = this.namehash(name);
      const tx = await this.resolver.setAddr(nameHash, address);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error setting address:', error);
      throw error;
    }
  }

  // Set text record for ENS name (requires ownership)
  async setTextRecord(name, key, value) {
    if (!this.signer) {
      throw new Error('Private key required for write operations');
    }

    try {
      const nameHash = this.namehash(name);
      const tx = await this.resolver.setText(nameHash, key, value);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error setting text record:', error);
      throw error;
    }
  }
}

// Usage example
async function main() {
  // Initialize ENS interaction (read-only)
  const ens = new ENSInteraction(process.env.RPC_URL || 'http://127.0.0.1:8545', process.env.PRIVATE_KEY);
  
  try {
    // Example: Resolve vitalik.eth
    const address = await ens.resolveAddress(process.env.TEST_ENS_NAME || 'vitalik.eth');
    console.log((process.env.TEST_ENS_NAME || 'vitalik.eth') + ' resolves to:', address);
    
    // Example: Get owner
    const owner = await ens.getOwner(process.env.TEST_ENS_NAME || 'vitalik.eth');
    console.log('Owner of ' + (process.env.TEST_ENS_NAME || 'vitalik.eth') + ':', owner);
    
    // Example: Get text record
    const twitter = await ens.getTextRecord(process.env.TEST_ENS_NAME || 'vitalik.eth', 'com.twitter');
    console.log('Twitter handle:', twitter);
    
  } catch (error) {
    console.error('ENS interaction failed:', error);
  }
}

// Export for use in other modules
module.exports = { ENSInteraction };

if (require.main === module) {
  main();
}
