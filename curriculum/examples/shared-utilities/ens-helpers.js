// Shared ENS Utilities
// Common helper functions used across all modules

const { ethers } = require('ethers');

/**
 * Calculate namehash for ENS name
 * @param {string} name - ENS name (e.g., "vitalik.eth")
 * @returns {string} - Namehash as hex string
 */
function namehash(name) {
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

/**
 * Validate ENS name format
 * @param {string} name - ENS name to validate
 * @returns {Object} - Validation result with valid boolean and errors array
 */
function validateENSName(name) {
  const errors = [];
  
  if (typeof name !== 'string') {
    errors.push('Name must be a string');
    return { valid: false, errors };
  }
  
  if (name.length < 3 || name.length > 63) {
    errors.push('Name must be between 3 and 63 characters');
  }
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push('Name can only contain lowercase letters, numbers, and hyphens');
  }
  
  if (/--/.test(name)) {
    errors.push('Name cannot contain consecutive hyphens');
  }
  
  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) {
    errors.push('Name must start and end with alphanumeric character');
  }
  
  const reserved = ['eth', 'xyz', 'com', 'org', 'net', 'io', 'app'];
  if (reserved.includes(name.toLowerCase())) {
    errors.push('This name is reserved');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Convert IPFS hash to ENS content hash
 * @param {string} ipfsHash - IPFS hash (e.g., "Qm...")
 * @returns {string} - ENS content hash
 */
function encodeContentHash(ipfsHash) {
  if (!ipfsHash.startsWith('Qm') && !ipfsHash.startsWith('bafy')) {
    throw new Error('Invalid IPFS hash format');
  }
  
  // Simple IPFS content hash encoding
  const hashBytes = ethers.utils.toUtf8Bytes(ipfsHash);
  const contentHash = ethers.utils.concat([
    ethers.utils.arrayify('0x01'), // IPFS protocol code
    ethers.utils.arrayify(hashBytes.length),
    hashBytes
  ]);
  
  return ethers.utils.hexlify(contentHash);
}

/**
 * Decode ENS content hash to IPFS hash
 * @param {string} contentHash - ENS content hash
 * @returns {string} - IPFS hash or original content
 */
function decodeContentHash(contentHash) {
  try {
    const bytes = ethers.utils.arrayify(contentHash);
    
    if (bytes[0] === 0x01) { // IPFS
      const length = bytes[1];
      const hashBytes = bytes.slice(2, 2 + length);
      return ethers.utils.toUtf8String(hashBytes);
    }
    
    return contentHash; // Return as-is if not IPFS
  } catch (error) {
    return contentHash; // Return original on error
  }
}

/**
 * Get contract addresses for different networks
 * @param {string} network - Network name ('mainnet', 'goerli', 'sepolia')
 * @returns {Object} - Contract addresses
 */
function getContractAddresses(network = 'mainnet') {
  const addresses = {
    mainnet: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
      baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      ethController: '0x253553366Da8546fC250F225fe3d25d0C782303b'
    },
    goerli: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      publicResolver: '0x4B1488B7a6B320d2D721406204aBc3eeAa9AD329',
      baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      ethController: '0xCc5e7dB10E2b927549dbcEacE848CC1D52f1fD101'
    },
    sepolia: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      publicResolver: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
      baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      ethController: '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72'
    }
  };
  
  return addresses[network] || addresses.mainnet;
}

/**
 * Format ETH value for display
 * @param {BigNumber|string} value - Value in wei
 * @param {number} decimals - Decimal places to show
 * @returns {string} - Formatted ETH value
 */
function formatEther(value, decimals = 4) {
  try {
    const etherValue = ethers.utils.formatEther(value);
    return parseFloat(etherValue).toFixed(decimals);
  } catch (error) {
    return '0.0000';
  }
}

/**
 * Parse ETH value to wei
 * @param {string|number} value - ETH value
 * @returns {BigNumber} - Value in wei
 */
function parseEther(value) {
  try {
    return ethers.utils.parseEther(value.toString());
  } catch (error) {
    return ethers.BigNumber.from(0);
  }
}

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility for operations
 * @param {Function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Result of operation
 */
async function retry(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        await sleep(delay);
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  namehash,
  validateENSName,
  encodeContentHash,
  decodeContentHash,
  getContractAddresses,
  formatEther,
  parseEther,
  sleep,
  retry
};
