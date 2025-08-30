require('dotenv').config();
// ENS Fundamentals - Advanced Operations & Gas Optimization
// This example demonstrates advanced ENS operations and gas optimization techniques

const { ethers } = require('ethers');

class ENSAdvancedOperations {
  constructor(providerUrl, privateKey = null) {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl || (process.env.RPC_URL || 'http://127.0.0.1:8545'));
    
    if (privateKey || process.env.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(privateKey || process.env.PRIVATE_KEY, this.provider);
    }
  }

  // Calculate namehash (same as basic example)
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

  // Batch resolve multiple ENS names
  async batchResolve(names) {
    const nameHashes = names.map(name => this.namehash(name));
    
    // Create multicall data
    const multicallData = nameHashes.map(nameHash => ({
      target: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41', // Public Resolver
      callData: new ethers.utils.Interface([
        'function addr(bytes32 node) view returns (address)'
      ]).encodeFunctionData('addr', [nameHash])
    }));

    // Note: This would require a multicall contract for actual batching
    // For demonstration, we'll resolve sequentially with concurrency
    const results = await Promise.allSettled(
      names.map(async (name) => {
        try {
          const nameHash = this.namehash(name);
          const resolver = new ethers.Contract(
            '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
            ['function addr(bytes32 node) view returns (address)'],
            this.provider
          );
          const address = await resolver.addr(nameHash);
          return { name, address, success: true };
        } catch (error) {
          return { name, error: error.message, success: false };
        }
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );
  }

  // Estimate gas for ENS operations
  async estimateGas(operation, params) {
    try {
      let gasEstimate;
      
      switch (operation) {
        case 'setAddr':
          const resolverContractForAddr = new ethers.Contract(
            '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
            ['function setAddr(bytes32 node, address addr)'],
            this.signer
          );
          gasEstimate = await resolverContractForAddr.estimateGas.setAddr(
            this.namehash(params.name), 
            params.address
          );
          break;
          
        case 'setText':
          const resolverContractForText = new ethers.Contract(
            '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
            ['function setText(bytes32 node, string key, string value)'],
            this.signer
          );
          gasEstimate = await resolverContractForText.estimateGas.setText(
            this.namehash(params.name), 
            params.key, 
            params.value
          );
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      // Add buffer for gas price fluctuations
      const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer
      
      return {
        gasEstimate: gasEstimate.toString(),
        gasLimit: gasLimit.toString(),
        estimatedCost: await this.calculateCost(gasEstimate)
      };
      
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw error;
    }
  }

  // Calculate transaction cost
  async calculateCost(gasAmount) {
    const gasPrice = await this.provider.getGasPrice();
    const cost = gasAmount.mul(gasPrice);
    return ethers.utils.formatEther(cost);
  }

  // Gas-optimized batch text record setting
  async batchSetTextRecords(name, records) {
    if (!this.signer) {
      throw new Error('Private key required for write operations');
    }

    const nameHash = this.namehash(name);
    const resolver = new ethers.Contract(
      '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
      ['function setText(bytes32 node, string key, string value)'],
      this.signer
    );

    // Execute in batches to optimize gas
    const batchSize = 3; // Limit concurrent transactions
    const batches = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    const results = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (record) => {
        try {
          const tx = await resolver.setText(nameHash, record.key, record.value);
          const receipt = await tx.wait();
          return {
            key: record.key,
            value: record.value,
            txHash: tx.hash,
            gasUsed: receipt.gasUsed.toString(),
            success: true
          };
        } catch (error) {
          return {
            key: record.key,
            error: error.message,
            success: false
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      ));
      
      // Small delay between batches to avoid network congestion
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  // Comprehensive ENS name analysis
  async analyzeENSName(name) {
    try {
      const nameHash = this.namehash(name);
      
      const [owner, resolverAddress] = await Promise.all([
        this.getOwner(name),
        this.getResolver(name)
      ]);
      
      let address = null;
      let textRecords = {};
      
      if (resolverAddress !== ethers.constants.AddressZero) {
        try {
          address = await this.resolveAddress(name);
          
          // Common text records to check
          const textKeys = ['email', 'url', 'avatar', 'com.twitter', 'com.github'];
          const textPromises = textKeys.map(key => 
            this.getTextRecord(name, key).catch(() => null)
          );
          const textValues = await Promise.all(textPromises);
          
          textKeys.forEach((key, index) => {
            if (textValues[index]) {
              textRecords[key] = textValues[index];
            }
          });
          
        } catch (error) {
          console.warn(`Could not resolve additional data for ${name}:`, error.message);
        }
      }
      
      return {
        name,
        nameHash,
        owner,
        resolver: resolverAddress,
        address,
        textRecords,
        hasResolver: resolverAddress !== ethers.constants.AddressZero,
        resolved: address !== null
      };
      
    } catch (error) {
      return {
        name,
        error: error.message,
        success: false
      };
    }
  }

  // Helper methods (same as basic example)
  async getOwner(name) {
    const registry = new ethers.Contract(
      '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      ['function owner(bytes32 node) view returns (address)'],
      this.provider
    );
    return await registry.owner(this.namehash(name));
  }

  async getResolver(name) {
    const registry = new ethers.Contract(
      '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      ['function resolver(bytes32 node) view returns (address)'],
      this.provider
    );
    return await registry.resolver(this.namehash(name));
  }

  async resolveAddress(name) {
    const resolver = new ethers.Contract(
      '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
      ['function addr(bytes32 node) view returns (address)'],
      this.provider
    );
    return await resolver.addr(this.namehash(name));
  }

  async getTextRecord(name, key) {
    const resolver = new ethers.Contract(
      '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
      ['function text(bytes32 node, string key) view returns (string)'],
      this.provider
    );
    return await resolver.text(this.namehash(name), key);
  }
}

// Usage examples
async function demonstrateAdvancedOperations() {
  const ens = new ENSAdvancedOperations(process.env.RPC_URL || 'http://127.0.0.1:8545', process.env.PRIVATE_KEY);
  
  console.log('=== ENS Advanced Operations Demo ===\n');
  
  // 1. Batch resolve multiple names
  console.log('1. Batch Resolution:');
  const names = [process.env.TEST_ENS_NAME || 'vitalik.eth', 'uniswap.eth', 'ens.eth', 'invalid.domain'];
  const batchResults = await ens.batchResolve(names);
  batchResults.forEach(result => {
    if (result.success) {
      console.log(`${result.name} → ${result.address}`);
    } else {
      console.log(`${result.name} → Error: ${result.error}`);
    }
  });
  
  console.log('\n2. ENS Name Analysis:');
  const analysis = await ens.analyzeENSName(process.env.TEST_ENS_NAME || 'vitalik.eth');
  console.log(JSON.stringify(analysis, null, 2));
  
  console.log('\n3. Gas Estimation Example:');
  // Note: This would require a signer for actual gas estimation
  console.log('Gas estimation requires a connected wallet with ENS ownership');
}

module.exports = { ENSAdvancedOperations };

if (require.main === module) {
  demonstrateAdvancedOperations().catch(console.error);
}
