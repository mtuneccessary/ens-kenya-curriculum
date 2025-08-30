const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
// Domain Registration & Management
// Complete example for .eth domain lifecycle management

const { ethers } = require('ethers');

// ENS Contract Addresses (Mainnet)
const ENS_CONTRACTS = {
  BASE_REGISTRAR: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  ETH_CONTROLLER: '0x253553366Da8546fC250F225fe3d25d0C782303b',
  PUBLIC_RESOLVER: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
};

// ABIs (simplified for demonstration)
const BASE_REGISTRAR_ABI = [
  'function available(uint256 id) view returns (bool)',
  'function nameExpires(uint256 id) view returns (uint256)',
  'function ownerOf(uint256 id) view returns (address)'
];

const ETH_CONTROLLER_ABI = [
  'function available(string name) view returns (bool)',
  'function rentPrice(string name, uint256 duration) view returns (uint256)',
  'function makeCommitment(string name, address owner, uint256 secret) pure returns (bytes32)',
  'function commit(bytes32 commitment)',
  'function register(string name, address owner, uint256 duration, uint256 secret) payable',
  'function renew(string name, uint256 duration) payable',
  'function minCommitmentAge() view returns (uint256)',
  'function maxCommitmentAge() view returns (uint256)'
];

class ENSDomainManager {
  constructor(providerUrl, privateKey) {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl || (process.env.RPC_URL || 'http://127.0.0.1:8545'));
    this.signer = new ethers.Wallet(privateKey || process.env.PRIVATE_KEY, this.provider);
    
    // Initialize contract instances
    this.baseRegistrar = new ethers.Contract(
      ENS_CONTRACTS.BASE_REGISTRAR,
      BASE_REGISTRAR_ABI,
      this.signer
    );
    
    this.ethController = new ethers.Contract(
      ENS_CONTRACTS.ETH_CONTROLLER,
      ETH_CONTROLLER_ABI,
      this.signer
    );
  }

  // Convert domain name to token ID
  nameToTokenId(name) {
    return ethers.BigNumber.from(ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(name)
    ));
  }

  // Check domain availability
  async checkAvailability(name) {
    try {
      const available = await this.ethController.available(name);
      return {
        name,
        available,
        status: available ? 'available' : 'unavailable'
      };
    } catch (error) {
      return {
        name,
        available: false,
        status: 'error',
        error: error.message
      };
    }
  }

  // Get registration cost estimate
  async getRegistrationCost(name, durationYears = 1) {
    try {
      const duration = durationYears * 365 * 24 * 60 * 60; // Convert to seconds
      const cost = await this.ethController.rentPrice(name, duration);
      
      // Estimate gas costs
      const gasPrice = await this.provider.getGasPrice();
      const estimatedGas = 200000; // Rough estimate for registration
      const gasCost = gasPrice.mul(estimatedGas);
      
      const totalCost = cost.add(gasCost);
      
      return {
        name,
        duration: `${durationYears} year${durationYears > 1 ? 's' : ''}`,
        registrationCost: ethers.utils.formatEther(cost),
        estimatedGasCost: ethers.utils.formatEther(gasCost),
        totalEstimatedCost: ethers.utils.formatEther(totalCost),
        costWei: cost,
        gasCostWei: gasCost,
        totalCostWei: totalCost
      };
    } catch (error) {
      throw new Error(`Cost estimation failed: ${error.message}`);
    }
  }

  // Register a domain with proper commitment flow
  async registerDomain(name, owner, durationYears = 1) {
    try {
      console.log(`Starting registration process for ${name}...`);
      
      // Step 1: Check availability
      const availability = await this.checkAvailability(name);
      if (!availability.available) {
        throw new Error(`Domain ${name} is not available for registration`);
      }
      
      // Step 2: Get cost estimate
      const costInfo = await this.getRegistrationCost(name, durationYears);
      console.log(`Estimated cost: ${costInfo.totalEstimatedCost} ETH`);
      
      // Step 3: Generate commitment
      const salt = ethers.utils.randomBytes(32);
      const commitment = await this.ethController.makeCommitment(name, owner, salt);
      
      console.log('Submitting commitment...');
      const commitTx = await this.ethController.commit(commitment);
      await commitTx.wait();
      console.log(`Commitment submitted: ${commitTx.hash}`);
      
      // Step 4: Wait for minimum commitment age
      const minAge = await this.ethController.minCommitmentAge();
      console.log(`Waiting ${minAge} seconds for commitment...`);
      await new Promise(resolve => setTimeout(resolve, minAge * 1000));
      
      // Step 5: Register the domain
      const duration = durationYears * 365 * 24 * 60 * 60;
      console.log('Registering domain...');
      
      const registerTx = await this.ethController.register(
        name,
        owner,
        duration,
        salt,
        { value: costInfo.costWei }
      );
      
      const receipt = await registerTx.wait();
      console.log(`Domain registered successfully: ${registerTx.hash}`);
      
      return {
        name,
        owner,
        transactionHash: registerTx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        cost: costInfo
      };
      
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Renew a domain
  async renewDomain(name, durationYears = 1) {
    try {
      console.log(`Renewing ${name} for ${durationYears} year${durationYears > 1 ? 's' : ''}...`);
      
      // Check if domain exists and get current expiration
      const tokenId = this.nameToTokenId(name);
      const expiration = await this.baseRegistrar.nameExpires(tokenId);
      
      if (expiration.eq(0)) {
        throw new Error(`Domain ${name} does not exist or has expired`);
      }
      
      // Get renewal cost
      const duration = durationYears * 365 * 24 * 60 * 60;
      const cost = await this.ethController.rentPrice(name, duration);
      
      console.log(`Renewal cost: ${ethers.utils.formatEther(cost)} ETH`);
      
      // Execute renewal
      const renewTx = await this.ethController.renew(name, duration, { value: cost });
      const receipt = await renewTx.wait();
      
      console.log(`Domain renewed successfully: ${renewTx.hash}`);
      
      return {
        name,
        duration: `${durationYears} year${durationYears > 1 ? 's' : ''}`,
        newExpiration: expiration.add(duration),
        transactionHash: renewTx.hash,
        gasUsed: receipt.gasUsed.toString(),
        cost: ethers.utils.formatEther(cost)
      };
      
    } catch (error) {
      console.error('Renewal failed:', error);
      throw error;
    }
  }

  // Get domain information
  async getDomainInfo(name) {
    try {
      const tokenId = this.nameToTokenId(name);
      
      const [available, expiration, owner] = await Promise.all([
        this.ethController.available(name),
        this.baseRegistrar.nameExpires(tokenId),
        this.baseRegistrar.ownerOf(tokenId).catch(() => ethers.constants.AddressZero)
      ]);
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = expiration.lt(now) && !expiration.eq(0);
      const daysUntilExpiration = expiration.eq(0) ? 0 : 
        Math.max(0, Math.floor((expiration.toNumber() - now) / (24 * 60 * 60)));
      
      return {
        name,
        tokenId: tokenId.toString(),
        available,
        registered: !available,
        owner: owner === ethers.constants.AddressZero ? null : owner,
        expiration: expiration.toNumber(),
        expirationDate: expiration.eq(0) ? null : new Date(expiration.toNumber() * 1000),
        daysUntilExpiration,
        isExpired,
        status: available ? 'available' : (isExpired ? 'expired' : 'active')
      };
      
    } catch (error) {
      return {
        name,
        error: error.message,
        status: 'error'
      };
    }
  }

  // Bulk domain operations
  async bulkCheckAvailability(names) {
    const results = await Promise.allSettled(
      names.map(name => this.checkAvailability(name))
    );
    
    return results.map((result, index) => ({
      ...names[index],
      ...(result.status === 'fulfilled' ? result.value : { error: result.reason.message })
    }));
  }

  // Bulk cost estimation
  async bulkCostEstimation(names, durationYears = 1) {
    const results = await Promise.allSettled(
      names.map(name => this.getRegistrationCost(name, durationYears))
    );
    
    return results.map((result, index) => ({
      ...names[index],
      ...(result.status === 'fulfilled' ? result.value : { error: result.reason.message })
    }));
  }

  // Get account balance
  async getBalance() {
    const balance = await this.signer.getBalance();
    return ethers.utils.formatEther(balance);
  }
}

// Utility functions for domain validation
function validateDomainName(name) {
  const errors = [];
  
  // Check length
  if (name.length < 3 || name.length > 63) {
    errors.push('Domain name must be between 3 and 63 characters');
  }
  
  // Check characters
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push('Domain name can only contain lowercase letters, numbers, and hyphens');
  }
  
  // Check starts/ends with alphanumeric
  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) {
    errors.push('Domain name must start and end with alphanumeric character');
  }
  
  // Check consecutive hyphens
  if (/--/.test(name)) {
    errors.push('Domain name cannot contain consecutive hyphens');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Usage example
async function demonstrateDomainManagement() {
  // Initialize manager using env (defaults to local fork)
  const manager = new ENSDomainManager(
    process.env.RPC_URL || 'http://127.0.0.1:8545',
    process.env.PRIVATE_KEY
  );
  
  console.log('=== ENS Domain Management Demo ===\n');
  
  try {
    // 1. Domain validation
    console.log('1. Domain Validation:');
    const validation = validateDomainName(process.env.TEST_DOMAIN_LABEL || 'my-test-domain');
    console.log((process.env.TEST_DOMAIN_LABEL || 'my-test-domain') + ' validation:', validation);
    
    // 2. Check availability
    console.log('\n2. Availability Check:');
    const label = process.env.TEST_DOMAIN_LABEL || 'my-test-domain';
    const availability = await manager.checkAvailability(label);
    console.log('Availability:', availability);
    
    // 3. Cost estimation
    if (availability.available) {
      console.log('\n3. Cost Estimation:');
      const cost = await manager.getRegistrationCost(label, Number(process.env.TEST_DOMAIN_YEARS || 1));
      console.log('Cost estimate:', JSON.stringify(cost, null, 2));
    }
    
    // 4. Get domain info for existing domain
    console.log('\n4. Domain Information:');
    const info = await manager.getDomainInfo(process.env.INFO_DOMAIN_LABEL || 'vitalik');
    console.log('Domain info:', JSON.stringify(info, null, 2));
    
    // 5. Bulk operations
    console.log('\n5. Bulk Availability Check:');
    const bulkNames = (process.env.BULK_LABELS || 'test1,test2,vitalik,ens').split(',');
    const bulkResults = await manager.bulkCheckAvailability(bulkNames);
    console.log('Bulk results:', JSON.stringify(bulkResults, null, 2));
    
  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

module.exports = { ENSDomainManager, validateDomainName };

if (require.main === module) {
  demonstrateDomainManagement().catch(console.error);
}
