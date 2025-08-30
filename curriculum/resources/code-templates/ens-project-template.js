// ENS Project Template
// A starting point for building ENS-integrated applications

const { ethers } = require('ethers');
const { namehash, validateENSName, getContractAddresses } = require('../shared-utilities/ens-helpers');

class ENSProject {
  constructor(network = 'mainnet') {
    this.network = network;
    this.provider = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the ENS project
   */
  async initialize() {
    try {
      console.log(`Initializing ENS Project for ${this.network}...`);

      // Set up provider
      const rpcUrl = this.getRPCUrl();
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Get contract addresses
      const addresses = getContractAddresses(this.network);

      // Initialize contracts
      this.contracts = {
        registry: new ethers.Contract(
          addresses.registry,
          [
            'function owner(bytes32 node) view returns (address)',
            'function resolver(bytes32 node) view returns (address)',
            'function setSubnodeOwner(bytes32 node, bytes32 label, address owner)',
            'function setResolver(bytes32 node, address resolver)'
          ],
          this.provider
        ),
        resolver: new ethers.Contract(
          addresses.publicResolver,
          [
            'function addr(bytes32 node) view returns (address)',
            'function setAddr(bytes32 node, address addr)',
            'function text(bytes32 node, string key) view returns (string)',
            'function setText(bytes32 node, string key, string value)',
            'function contenthash(bytes32 node) view returns (bytes)',
            'function setContenthash(bytes32 node, bytes hash)'
          ],
          this.provider
        )
      };

      // Test connection
      await this.provider.getBlockNumber();

      this.isInitialized = true;
      console.log('ENS Project initialized successfully!');

    } catch (error) {
      console.error('ENS Project initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get RPC URL for the network
   */
  getRPCUrl() {
    const urls = {
      mainnet: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      goerli: process.env.GOERLI_RPC_URL || 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
      sepolia: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
    };

    return urls[this.network] || urls.mainnet;
  }

  /**
   * Resolve an ENS name to an Ethereum address
   * @param {string} name - ENS name (e.g., 'vitalik.eth')
   * @returns {string} - Ethereum address
   */
  async resolveName(name) {
    if (!this.isInitialized) {
      throw new Error('ENS Project not initialized');
    }

    try {
      // Validate the name
      const validation = validateENSName(name);
      if (!validation.valid) {
        throw new Error(`Invalid ENS name: ${validation.errors.join(', ')}`);
      }

      // Calculate namehash
      const nameHash = namehash(name);

      // Get the resolver address
      const resolverAddress = await this.contracts.registry.resolver(nameHash);

      if (resolverAddress === ethers.constants.AddressZero) {
        throw new Error(`No resolver set for ${name}`);
      }

      // Resolve the name using the resolver
      const address = await this.contracts.resolver.addr(nameHash);

      if (address === ethers.constants.AddressZero) {
        throw new Error(`No address set for ${name}`);
      }

      console.log(`${name} resolves to: ${address}`);
      return address;

    } catch (error) {
      console.error(`Failed to resolve ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Get text record from an ENS name
   * @param {string} name - ENS name
   * @param {string} key - Text record key (e.g., 'email', 'url', 'com.twitter')
   * @returns {string} - Text record value
   */
  async getTextRecord(name, key) {
    if (!this.isInitialized) {
      throw new Error('ENS Project not initialized');
    }

    try {
      const validation = validateENSName(name);
      if (!validation.valid) {
        throw new Error(`Invalid ENS name: ${validation.errors.join(', ')}`);
      }

      const nameHash = namehash(name);
      const value = await this.contracts.resolver.text(nameHash, key);

      console.log(`Text record ${key} for ${name}: ${value}`);
      return value;

    } catch (error) {
      console.error(`Failed to get text record ${key} for ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Set text record for an ENS name (requires ownership)
   * @param {string} name - ENS name
   * @param {string} key - Text record key
   * @param {string} value - Text record value
   * @param {string} privateKey - Private key of the owner
   */
  async setTextRecord(name, key, value, privateKey) {
    if (!this.isInitialized) {
      throw new Error('ENS Project not initialized');
    }

    try {
      const validation = validateENSName(name);
      if (!validation.valid) {
        throw new Error(`Invalid ENS name: ${validation.errors.join(', ')}`);
      }

      // Create signer
      const signer = new ethers.Wallet(privateKey, this.provider);
      const signerAddress = await signer.getAddress();

      // Check ownership
      const nameHash = namehash(name);
      const owner = await this.contracts.registry.owner(nameHash);

      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error(`You don't own ${name}. Owner: ${owner}`);
      }

      // Set text record
      const resolverWithSigner = this.contracts.resolver.connect(signer);
      const tx = await resolverWithSigner.setText(nameHash, key, value);

      console.log(`Setting text record ${key} for ${name}...`);
      console.log('Transaction hash:', tx.hash);

      await tx.wait();

      console.log(`Text record ${key} set successfully for ${name}`);
      return tx;

    } catch (error) {
      console.error(`Failed to set text record ${key} for ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Get content hash from an ENS name
   * @param {string} name - ENS name
   * @returns {string} - Content hash
   */
  async getContentHash(name) {
    if (!this.isInitialized) {
      throw new Error('ENS Project not initialized');
    }

    try {
      const validation = validateENSName(name);
      if (!validation.valid) {
        throw new Error(`Invalid ENS name: ${validation.errors.join(', ')}`);
      }

      const nameHash = namehash(name);
      const contentHash = await this.contracts.resolver.contenthash(nameHash);

      console.log(`Content hash for ${name}:`, ethers.utils.hexlify(contentHash));
      return ethers.utils.hexlify(contentHash);

    } catch (error) {
      console.error(`Failed to get content hash for ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a subdomain
   * @param {string} parentName - Parent domain (e.g., 'mycompany.eth')
   * @param {string} subdomainName - Subdomain name (e.g., 'alice')
   * @param {string} ownerAddress - Address to own the subdomain
   * @param {string} privateKey - Private key of parent domain owner
   */
  async createSubdomain(parentName, subdomainName, ownerAddress, privateKey) {
    if (!this.isInitialized) {
      throw new Error('ENS Project not initialized');
    }

    try {
      const parentValidation = validateENSName(parentName);
      if (!parentValidation.valid) {
        throw new Error(`Invalid parent domain: ${parentValidation.errors.join(', ')}`);
      }

      // Create signer
      const signer = new ethers.Wallet(privateKey, this.provider);
      const signerAddress = await signer.getAddress();

      // Check ownership of parent domain
      const parentHash = namehash(parentName);
      const parentOwner = await this.contracts.registry.owner(parentHash);

      if (parentOwner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error(`You don't own ${parentName}. Owner: ${parentOwner}`);
      }

      // Create subdomain
      const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(subdomainName));
      const registryWithSigner = this.contracts.registry.connect(signer);

      const tx = await registryWithSigner.setSubnodeOwner(parentHash, labelHash, ownerAddress);

      console.log(`Creating subdomain ${subdomainName}.${parentName}...`);
      console.log('Transaction hash:', tx.hash);

      await tx.wait();

      console.log(`Subdomain ${subdomainName}.${parentName} created successfully!`);
      return tx;

    } catch (error) {
      console.error(`Failed to create subdomain ${subdomainName}.${parentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Batch resolve multiple ENS names
   * @param {string[]} names - Array of ENS names
   * @returns {Object[]} - Array of resolution results
   */
  async batchResolve(names) {
    if (!this.isInitialized) {
      throw new Error('ENS Project not initialized');
    }

    console.log(`Batch resolving ${names.length} names...`);

    const results = await Promise.allSettled(
      names.map(async (name) => {
        try {
          const address = await this.resolveName(name);
          return { name, address, success: true };
        } catch (error) {
          return { name, error: error.message, success: false };
        }
      })
    );

    const resolvedResults = results.map((result, index) => ({
      name: names[index],
      ...(result.status === 'fulfilled' ? result.value : result.reason)
    }));

    console.log(`Batch resolution complete. Success: ${resolvedResults.filter(r => r.success).length}/${names.length}`);
    return resolvedResults;
  }

  /**
   * Get comprehensive ENS profile
   * @param {string} name - ENS name
   * @returns {Object} - Complete profile information
   */
  async getProfile(name) {
    if (!this.isInitialized) {
      throw new Error('ENS Project not initialized');
    }

    try {
      console.log(`Fetching profile for ${name}...`);

      // Get basic information
      const [address, owner] = await Promise.all([
        this.resolveName(name).catch(() => null),
        this.contracts.registry.owner(namehash(name)).catch(() => null)
      ]);

      // Get text records
      const textKeys = ['description', 'url', 'email', 'com.twitter', 'com.github', 'avatar'];
      const textPromises = textKeys.map(key => this.getTextRecord(name, key).catch(() => ''));
      const textValues = await Promise.all(textPromises);

      const textRecords = {};
      textKeys.forEach((key, index) => {
        if (textValues[index]) {
          textRecords[key] = textValues[index];
        }
      });

      // Get content hash
      const contentHash = await this.getContentHash(name).catch(() => null);

      const profile = {
        name,
        address,
        owner,
        textRecords,
        contentHash,
        timestamp: new Date().toISOString()
      };

      console.log(`Profile fetched successfully for ${name}`);
      return profile;

    } catch (error) {
      console.error(`Failed to fetch profile for ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Get network information
   * @returns {Object} - Network details
   */
  getNetworkInfo() {
    return {
      network: this.network,
      isInitialized: this.isInitialized,
      provider: this.provider ? 'connected' : 'disconnected',
      contracts: Object.keys(this.contracts)
    };
  }
}

// Export for use in other files
module.exports = ENSProject;

// Usage example
async function main() {
  try {
    // Initialize project
    const ensProject = new ENSProject('goerli'); // Use testnet for development
    await ensProject.initialize();

    // Resolve a name
    const address = await ensProject.resolveName('vitalik.eth');
    console.log('Resolved address:', address);

    // Get text record
    const twitter = await ensProject.getTextRecord('vitalik.eth', 'com.twitter');
    console.log('Twitter handle:', twitter);

    // Batch resolve
    const batchResults = await ensProject.batchResolve([
      'vitalik.eth',
      'ens.eth',
      'uniswap.eth'
    ]);
    console.log('Batch results:', batchResults);

  } catch (error) {
    console.error('ENS Project demo failed:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
