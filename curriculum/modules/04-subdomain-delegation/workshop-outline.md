# Module 04: Subdomain Delegation & Management

## Overview
Master the art of subdomain creation and delegation to build scalable ENS architectures for communities, DAOs, and organizations.

## 🎯 Learning Objectives
- Create and manage subdomain structures
- Implement delegation patterns
- Build community subdomain systems
- Design scalable ENS architectures

## 🏗 Workshop Structure

### Phase 1: Subdomain Fundamentals (45 min)
- **Subdomain Creation**: Technical process
- **Permission Models**: Owner vs controller rights
- **Delegation Strategies**: Different approaches
- **Live Demo**: Creating subdomains

### Phase 2: Community Systems (45 min)
- **DAO Integration**: Governance-controlled subdomains
- **Membership Management**: Automated delegation
- **Role-based Access**: Permission hierarchies
- **Practical Exercise**: Build community system

### Phase 3: Advanced Patterns (45 min)
- **Bulk Delegation**: Mass subdomain operations
- **Template Systems**: Reusable configurations
- **Event Integration**: Automated responses
- **Security Considerations**: Access control

### Phase 4: Real-world Implementation (45 min)
- **Case Studies**: Successful implementations
- **Integration Challenges**: Common obstacles
- **Scaling Solutions**: Enterprise patterns
- **Project Work**: Custom subdomain system

## 🛠 Technical Implementation

### Basic Subdomain Creation
```javascript
async function createSubdomain(parentName, subdomainName, owner) {
  const resolver = getResolverContract();
  const registry = getRegistryContract();
  
  const parentHash = namehash(parentName);
  const subdomainHash = namehash(`${subdomainName}.${parentName}`);
  const labelHash = keccak256(subdomainName);
  
  // Set subdomain owner
  await registry.setSubnodeOwner(parentHash, labelHash, owner);
  
  // Configure resolver
  await registry.setResolver(subdomainHash, resolver.address);
  
  // Set address record
  await resolver.setAddr(subdomainHash, owner);
}
```

### Automated Delegation System
```javascript
class SubdomainManager {
  constructor(parentDomain) {
    this.parentDomain = parentDomain;
    this.templates = new Map();
  }
  
  // Register delegation template
  registerTemplate(name, config) {
    this.templates.set(name, config);
  }
  
  // Apply template to subdomain
  async applyTemplate(subdomainName, templateName) {
    const template = this.templates.get(templateName);
    const subdomain = `${subdomainName}.${this.parentDomain}`;
    
    // Create subdomain
    await this.createSubdomain(subdomainName, template.owner);
    
    // Apply template configuration
    for (const record of template.records) {
      await this.setRecord(subdomain, record.key, record.value);
    }
  }
}
```

### DAO Membership System
```javascript
class DAOSubdomainManager extends SubdomainManager {
  constructor(daoContract, parentDomain) {
    super(parentDomain);
    this.dao = daoContract;
  }
  
  async grantMembership(memberAddress, role = 'member') {
    // Verify DAO membership
    const isMember = await this.dao.isMember(memberAddress);
    if (!isMember) throw new Error('Not a DAO member');
    
    // Create personalized subdomain
    const subdomainName = await this.generateSubdomainName(memberAddress);
    await this.applyTemplate(subdomainName, role);
    
    // Set up role-based permissions
    await this.configurePermissions(subdomainName, role);
  }
  
  async generateSubdomainName(address) {
    // Create unique subdomain from address
    return address.slice(2, 8).toLowerCase();
  }
}
```

## 🚀 Workshop Exercises

### Exercise 1: Basic Subdomain Factory
**Objective:** Build a simple subdomain creation system
- Create subdomains programmatically
- Set basic records (address, text)
- Handle error cases
- Test with multiple subdomains

### Exercise 2: Community Management System
**Objective:** Create a community subdomain manager
- Automated member onboarding
- Role-based subdomain configuration
- Batch operations
- Permission management

### Exercise 3: Enterprise Template System
**Objective:** Build a scalable template-based system
- Define reusable configurations
- Apply templates dynamically
- Manage template updates
- Version control for templates

## 📊 Real-world Patterns

### Community DAOs
```
dao.eth/
├── member1.dao.eth → Member's personal subdomain
├── member2.dao.eth → Member's personal subdomain
└── council.dao.eth → Governance subdomain
```

### Corporate Structure
```
company.eth/
├── hr.company.eth → Human resources
├── engineering.company.eth → Development team
├── marketing.company.eth → Marketing department
└── *.company.eth → Employee subdomains
```

### Event Management
```
conference.eth/
├── speaker1.conference.eth → Speaker profile
├── workshop1.conference.eth → Workshop resources
├── attendee1.conference.eth → Attendee badge
└── sponsor1.conference.eth → Sponsor presence
```

## 🔒 Security & Access Control

### Permission Levels
- **Owner**: Full control over subdomain
- **Controller**: Can modify records but not ownership
- **Manager**: Limited record modification rights
- **Viewer**: Read-only access

### Smart Contract Integration
```solidity
contract SubdomainController {
    mapping(bytes32 => address) public controllers;
    mapping(bytes32 => mapping(address => bool)) public managers;
    
    function setController(bytes32 node, address controller) external {
        require(isAuthorized(msg.sender, node), "Unauthorized");
        controllers[node] = controller;
    }
    
    function addManager(bytes32 node, address manager) external {
        require(isAuthorized(msg.sender, node), "Unauthorized");
        managers[node][manager] = true;
    }
}
```

## 📈 Scaling Strategies

### Bulk Operations
- **Batch Creation**: Create multiple subdomains in one transaction
- **Template Application**: Apply configurations to many subdomains
- **Automated Management**: Smart contract-based delegation
- **Off-chain Processing**: Handle large-scale operations efficiently

### Performance Optimization
- **Gas Optimization**: Minimize transaction costs
- **Caching**: Cache frequently accessed data
- **Lazy Loading**: Load subdomain data on demand
- **Event-driven Updates**: React to blockchain events

## 🎯 Success Metrics

### Technical Achievement
- [ ] Create 10+ subdomains programmatically
- [ ] Implement delegation system
- [ ] Build template-based configuration
- [ ] Handle error scenarios gracefully

### Workshop Engagement
- [ ] 90% exercise completion rate
- [ ] Active participation in discussions
- [ ] Successful project demonstrations
- [ ] Positive feedback on learning experience

## 🔄 Continuous Learning

### Advanced Topics for Follow-up
- **Layer 2 Integration**: Optimism/Arbitrum subdomain management
- **Cross-chain Subdomains**: Multi-chain ENS resolution
- **Decentralized Governance**: DAO-controlled subdomain policies
- **NFT Integration**: Token-gated subdomain access

### Community Resources
- **ENS Discord**: Technical discussions and support
- **GitHub Issues**: Report bugs and request features
- **ENS Blog**: Latest developments and best practices
- **Community Forums**: Share implementations and experiences
