// React Native ENS Manager
// Mobile-specific ENS integration for iOS and Android

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { namehash, validateENSName, getContractAddresses } from '../shared-utilities/ens-helpers';

class ENSMobileManager {
  constructor(network = 'mainnet') {
    this.network = network;
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.cache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize ENS manager with network configuration
   */
  async initialize() {
    try {
      const addresses = getContractAddresses(this.network);
      const rpcUrl = this.getRPCUrl(this.network);
      
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Initialize contracts
      this.contracts = {
        registry: new ethers.Contract(
          addresses.registry,
          [
            'function owner(bytes32 node) view returns (address)',
            'function resolver(bytes32 node) view returns (address)',
            'function setSubnodeOwner(bytes32 node, bytes32 label, address owner)'
          ],
          this.provider
        ),
        resolver: new ethers.Contract(
          addresses.publicResolver,
          [
            'function addr(bytes32 node) view returns (address)',
            'function text(bytes32 node, string key) view returns (string)',
            'function setAddr(bytes32 node, address addr)',
            'function setText(bytes32 node, string key, string value)'
          ],
          this.provider
        )
      };

      // Load cached data
      await this.loadCache();
      
      this.isInitialized = true;
      console.log(`ENS Mobile Manager initialized for ${this.network}`);
      
    } catch (error) {
      console.error('ENS Mobile Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get appropriate RPC URL for the platform
   */
  getRPCUrl(network) {
    const urls = {
      mainnet: {
        ios: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        android: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        default: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
      },
      goerli: {
        ios: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
        android: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
        default: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID'
      },
      sepolia: {
        ios: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
        android: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
        default: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
      }
    };

    const networkUrls = urls[network] || urls.mainnet;
    const platform = Platform.OS;
    
    return networkUrls[platform] || networkUrls.default;
  }

  /**
   * Load cached ENS data from AsyncStorage
   */
  async loadCache() {
    try {
      const cachedData = await AsyncStorage.getItem('ens_cache');
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(cache));
      }
    } catch (error) {
      console.warn('Failed to load ENS cache:', error);
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  async saveCache() {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('ens_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save ENS cache:', error);
    }
  }

  /**
   * Securely store private key
   */
  async storePrivateKey(key) {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await SecureStore.setItemAsync('ens_private_key', key, {
          keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY
        });
      } else {
        await AsyncStorage.setItem('ens_private_key', key);
      }
    } catch (error) {
      console.error('Failed to store private key:', error);
      throw error;
    }
  }

  /**
   * Retrieve stored private key
   */
  async getPrivateKey() {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return await SecureStore.getItemAsync('ens_private_key');
      } else {
        return await AsyncStorage.getItem('ens_private_key');
      }
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }

  /**
   * Connect wallet with stored private key
   */
  async connectWallet() {
    try {
      const privateKey = await this.getPrivateKey();
      if (!privateKey) {
        throw new Error('No private key found. Please import or create a wallet.');
      }

      this.signer = new ethers.Wallet(privateKey, this.provider);
      console.log('Wallet connected:', await this.signer.getAddress());
      
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Resolve ENS name to address with caching
   */
  async resolveENS(name) {
    if (!this.isInitialized) {
      throw new Error('ENS Manager not initialized');
    }

    try {
      // Check cache first
      const cacheKey = `resolve:${name}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.address;
        }
      }

      // Validate name
      const validation = validateENSName(name);
      if (!validation.valid) {
        throw new Error(`Invalid ENS name: ${validation.errors.join(', ')}`);
      }

      // Resolve name
      const nameHash = namehash(name);
      const address = await this.contracts.resolver.addr(nameHash);

      // Cache result
      this.cache.set(cacheKey, {
        address,
        timestamp: Date.now()
      });
      await this.saveCache();

      return address;

    } catch (error) {
      console.error('ENS resolution failed:', error);
      throw error;
    }
  }

  /**
   * Get text record from ENS name
   */
  async getTextRecord(name, key) {
    if (!this.isInitialized) {
      throw new Error('ENS Manager not initialized');
    }

    try {
      const cacheKey = `text:${name}:${key}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) {
          return cached.value;
        }
      }

      const nameHash = namehash(name);
      const value = await this.contracts.resolver.text(nameHash, key);

      this.cache.set(cacheKey, {
        value,
        timestamp: Date.now()
      });
      await this.saveCache();

      return value;

    } catch (error) {
      console.error('Text record fetch failed:', error);
      throw error;
    }
  }

  /**
   * Set text record for owned ENS name
   */
  async setTextRecord(name, key, value) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // Verify ownership
      const nameHash = namehash(name);
      const owner = await this.contracts.registry.owner(nameHash);
      const signerAddress = await this.signer.getAddress();

      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('You do not own this ENS name');
      }

      // Set text record
      const tx = await this.contracts.resolver.connect(this.signer).setText(
        nameHash,
        key,
        value
      );

      console.log('Setting text record...', tx.hash);
      await tx.wait();
      
      // Update cache
      const cacheKey = `text:${name}:${key}`;
      this.cache.set(cacheKey, {
        value,
        timestamp: Date.now()
      });
      await this.saveCache();

      return tx;

    } catch (error) {
      console.error('Set text record failed:', error);
      throw error;
    }
  }

  /**
   * Batch resolve multiple ENS names
   */
  async batchResolve(names) {
    if (!this.isInitialized) {
      throw new Error('ENS Manager not initialized');
    }

    try {
      const results = await Promise.allSettled(
        names.map(async (name) => {
          try {
            return await this.resolveENS(name);
          } catch (error) {
            return { error: error.message };
          }
        })
      );

      return results.map((result, index) => ({
        name: names[index],
        address: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
        success: result.status === 'fulfilled'
      }));

    } catch (error) {
      console.error('Batch resolution failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive ENS profile
   */
  async getENSProfile(name) {
    if (!this.isInitialized) {
      throw new Error('ENS Manager not initialized');
    }

    try {
      const [address, description, avatar, twitter, github, website] = await Promise.all([
        this.resolveENS(name),
        this.getTextRecord(name, 'description').catch(() => ''),
        this.getTextRecord(name, 'avatar').catch(() => ''),
        this.getTextRecord(name, 'com.twitter').catch(() => ''),
        this.getTextRecord(name, 'com.github').catch(() => ''),
        this.getTextRecord(name, 'url').catch(() => '')
      ]);

      return {
        name,
        address,
        description,
        avatar,
        social: {
          twitter,
          github,
          website
        },
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Profile fetch failed:', error);
      throw error;
    }
  }

  /**
   * Show native alert for user feedback
   */
  showAlert(title, message, onPress = null) {
    Alert.alert(
      title,
      message,
      onPress ? [{ text: 'OK', onPress }] : [{ text: 'OK' }]
    );
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    this.cache.clear();
    await AsyncStorage.removeItem('ens_cache');
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      network: this.network,
      platform: Platform.OS,
      isInitialized: this.isInitialized,
      hasWallet: !!this.signer,
      cacheSize: this.cache.size
    };
  }
}

export default ENSMobileManager;
