# Module 02: Domain Registration & Management

## Overview
This module focuses on the practical aspects of registering, renewing, and managing .eth domains using ENS smart contracts and available tools.

## 🎯 Learning Objectives
By the end of this module, participants will:
- Register .eth domains programmatically
- Manage domain renewals and expiration
- Transfer domain ownership
- Implement bulk registration strategies
- Optimize registration costs

## 📋 Module Outline

### 2.1 Domain Registration Process
- **Registration Requirements**: Name availability, character limits, reserved names
- **Registration Flow**: Commitment → Registration → Confirmation
- **Cost Calculation**: Base cost + gas fees + premium pricing
- **Duration Options**: 1-10 year registration periods

### 2.2 Renewal & Expiration Management
- **Renewal Timeline**: Grace period and expiration process
- **Auto-renewal Strategies**: Smart contract automation
- **Cost Implications**: Renewal pricing vs initial registration
- **Recovery Options**: Expired domain recovery process

### 2.3 Ownership Transfers
- **Direct Transfers**: Transfer to another address
- **Wrapped Domains**: Name Wrapper functionality
- **Permission Models**: Controller vs owner permissions
- **Security Considerations**: Transfer safety measures

### 2.4 Bulk Operations
- **Bulk Registration**: Multiple domain registration
- **Batch Renewals**: Efficient renewal management
- **Portfolio Management**: Large-scale domain operations
- **Cost Optimization**: Gas-efficient batch operations

## 🛠 Hands-on Exercises

### Exercise 2.1: Domain Availability Check
**Objective:** Check if a domain is available for registration
```javascript
async function checkAvailability(name) {
  const baseRegistrar = new ethers.Contract(BASE_REGISTRAR_ADDRESS, BASE_REGISTRAR_ABI, provider);
  const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name));
  const available = await baseRegistrar.available(labelHash);
  return available;
}
```

### Exercise 2.2: Domain Registration
**Objective:** Register a .eth domain with proper commitment flow
```javascript
async function registerDomain(name, owner, duration) {
  const controller = new ethers.Contract(ETH_CONTROLLER_ADDRESS, ETH_CONTROLLER_ABI, signer);
  
  // Generate salt for commitment
  const salt = ethers.utils.randomBytes(32);
  const commitment = await controller.makeCommitment(name, owner, salt);
  
  // Submit commitment
  await controller.commit(commitment);
  
  // Wait and then register
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  
  const cost = await controller.rentPrice(name, duration);
  await controller.register(name, owner, duration, salt, { value: cost });
}
```

### Exercise 2.3: Domain Renewal
**Objective:** Renew an existing domain registration
```javascript
async function renewDomain(name, duration) {
  const controller = new ethers.Contract(ETH_CONTROLLER_ADDRESS, ETH_CONTROLLER_ABI, signer);
  
  const cost = await controller.rentPrice(name, duration);
  await controller.renew(name, duration, { value: cost });
}
```

## 📚 Key Concepts

### Registration Flow
1. **Commitment Phase**: Submit blinded commitment to prevent front-running
2. **Waiting Period**: 60-second minimum wait time
3. **Registration Phase**: Reveal commitment and pay for registration
4. **Confirmation**: Domain is registered to your address

### Cost Structure
- **Base Price**: Algorithmic pricing based on name length and desirability
- **Gas Fees**: Ethereum network transaction costs
- **Premium Pricing**: Special pricing for short or desirable names
- **Bulk Discounts**: Reduced rates for multiple registrations

### Duration Management
- **Minimum**: 1 year (28,800 blocks)
- **Maximum**: 10 years
- **Grace Period**: 90 days after expiration
- **Premium Period**: Additional time for expired premium domains

## 🔧 Tools & Interfaces

### Official ENS Tools
- **ENS Manager**: Web interface for domain management
- **ENS CLI**: Command-line tools for automation
- **ENS SDK**: JavaScript library for integration

### Third-party Tools
- **ENS Vision**: Domain portfolio management
- **ENS Tools**: Bulk operation utilities
- **ENS Subgraph**: GraphQL API for ENS data

## 🏪 Workshop Activities

### Activity 1: Domain Registration
1. Check domain availability
2. Estimate registration costs
3. Execute registration transaction
4. Verify ownership and records

### Activity 2: Portfolio Management
1. View owned domains
2. Check expiration dates
3. Set up renewal reminders
4. Transfer domains securely

### Activity 3: Bulk Operations
1. Register multiple domains
2. Batch renewal process
3. Cost optimization strategies
4. Error handling for failed transactions

## 📊 Cost Optimization Strategies

### Gas Optimization
- **Batch Transactions**: Combine multiple operations
- **Optimal Timing**: Register during low gas periods
- **Gas Estimation**: Accurate gas limit setting
- **Layer 2**: Use L2 solutions for cheaper operations

### Pricing Strategies
- **Long-term Registration**: Discounted rates for longer periods
- **Bulk Purchasing**: Volume discounts for multiple domains
- **Timing**: Take advantage of dynamic pricing
- **Renewal Timing**: Early renewal benefits

## ⚠️ Best Practices

### Security Considerations
- **Private Key Management**: Secure storage of domain-owning keys
- **Two-Factor Authentication**: Additional security layers
- **Backup Owners**: Multiple authorized addresses
- **Transfer Verification**: Confirm recipient before transfer

### Operational Best Practices
- **Regular Monitoring**: Track domain expiration dates
- **Automated Renewals**: Set up smart contract renewals
- **Cost Tracking**: Monitor registration and renewal expenses
- **Documentation**: Maintain records of domain ownership

## 📖 Additional Resources
- [ENS Registration Guide](https://docs.ens.domains/dapp-developer-guide/registering-names)
- [ENS Pricing Algorithm](https://docs.ens.domains/contract-api-reference/.eth-permanent-registrar/controller#rentprice)
- [Bulk Registration Tools](https://ens.tools/)
- [ENS Manager](https://app.ens.domains/)

## ✅ Module Assessment
**Quiz Questions:**
1. What is the ENS registration commitment process?
2. How does ENS pricing work for .eth domains?
3. What are the options for domain renewal?
4. How can you optimize costs for bulk registrations?

**Practical Challenge:**
Implement a domain registration system that can:
- Check domain availability
- Estimate registration costs
- Handle the commitment → registration flow
- Support bulk operations
- Provide cost optimization recommendations
