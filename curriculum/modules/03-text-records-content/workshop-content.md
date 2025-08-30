# Module 03: Text Records, Content Hashes & Avatars

## Overview
This module explores advanced ENS features that enable rich metadata storage and decentralized content linking, transforming domains into comprehensive digital identity profiles.

## 🎯 Learning Objectives
By the end of this module, participants will:
- Manage text records for domain metadata
- Link content hashes for decentralized hosting
- Implement avatar systems
- Understand ENS metadata standards

## 📋 Module Outline

### 3.1 Text Records Deep Dive
- **Standard Text Keys**: email, url, avatar, social media
- **Custom Records**: Organization-specific metadata
- **Record Management**: Setting, updating, removing records
- **Privacy Considerations**: Public vs private information

### 3.2 Content Hash Resolution
- **IPFS Integration**: Decentralized content hosting
- **Content Addressing**: Immutable content linking
- **Gateway Resolution**: Accessing content via ENS
- **Multi-format Support**: Various content types

### 3.3 Avatar Implementation
- **Image Standards**: NFT, HTTP, IPFS avatars
- **Resolution Process**: How avatars are resolved
- **Display Integration**: UI implementation patterns
- **Fallback Systems**: Default avatar handling

### 3.4 Metadata Standards
- **ENS Profile Standard**: Standardized profile data
- **Schema Compliance**: Following established patterns
- **Interoperability**: Cross-platform compatibility
- **Future Extensions**: Emerging standards

## 🛠 Practical Implementation

### Text Records Management
```javascript
// Set multiple text records
async function setProfileRecords(name, profile) {
  const records = [
    { key: 'email', value: profile.email },
    { key: 'url', value: profile.website },
    { key: 'com.twitter', value: profile.twitter },
    { key: 'com.github', value: profile.github },
    { key: 'org.telegram', value: profile.telegram }
  ];
  
  for (const record of records) {
    await setTextRecord(name, record.key, record.value);
  }
}
```

### Content Hash Linking
```javascript
// Link IPFS content to ENS
async function linkContent(name, ipfsHash) {
  const contentHash = encodeContentHash(`ipfs://${ipfsHash}`);
  await setContentHash(name, contentHash);
}

// Resolve content
async function resolveContent(name) {
  const contentHash = await getContentHash(name);
  return decodeContentHash(contentHash);
}
```

### Avatar Integration
```javascript
// Set NFT avatar
async function setNFTAavatar(name, contractAddress, tokenId) {
  const avatar = `eip155:1/erc721:${contractAddress}/${tokenId}`;
  await setTextRecord(name, 'avatar', avatar);
}

// Resolve avatar URL
function getAvatarUrl(avatar) {
  if (avatar.startsWith('https://')) {
    return avatar;
  }
  if (avatar.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${avatar.slice(7)}`;
  }
  // Handle NFT avatars
  return resolveNFTAavatar(avatar);
}
```

## 🚀 Workshop Activities

### Activity 1: Profile Builder
Build a complete ENS profile with:
- Personal information (email, social links)
- Professional details (website, bio)
- Content linking (blog, portfolio)
- Avatar integration

### Activity 2: Content Publisher
Create a decentralized content system:
- Upload content to IPFS
- Link via ENS content hash
- Create resolvable URLs
- Implement content updates

### Activity 3: Avatar System
Develop an avatar management system:
- Support multiple avatar types
- Implement resolution logic
- Create fallback mechanisms
- Build user interface components

## 📚 Advanced Patterns

### Batch Operations
```javascript
// Efficient batch text record updates
async function batchUpdateRecords(name, updates) {
  const resolver = getResolverContract();
  const nameHash = namehash(name);
  
  // Prepare multicall data
  const calls = updates.map(update => ({
    target: resolver.address,
    callData: resolver.interface.encodeFunctionData(
      'setText', [nameHash, update.key, update.value]
    )
  }));
  
  // Execute batch transaction
  await multicall(calls);
}
```

### Content Management System
```javascript
class ENSContentManager {
  async publish(name, content) {
    // Upload to IPFS
    const ipfsHash = await ipfs.add(content);
    
    // Update ENS content hash
    await this.setContentHash(name, ipfsHash);
    
    // Update metadata
    await this.updateMetadata(name, {
      lastUpdated: Date.now(),
      version: await this.getVersion(name) + 1,
      contentType: content.type
    });
  }
}
```

## 🔧 Integration Examples

### React Profile Component
```jsx
function ENSProfile({ name }) {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    loadENSProfile(name).then(setProfile);
  }, [name]);
  
  if (!profile) return <div>Loading...</div>;
  
  return (
    <div className="ens-profile">
      <Avatar src={profile.avatar} />
      <h2>{name}.eth</h2>
      <p>{profile.description}</p>
      <SocialLinks links={profile.social} />
    </div>
  );
}
```

### Content Resolver Service
```javascript
class ContentResolver {
  async resolve(name) {
    const contentHash = await getContentHash(name);
    const metadata = await getTextRecord(name, 'metadata');
    
    return {
      content: await fetchContent(contentHash),
      metadata: JSON.parse(metadata),
      lastModified: await getTextRecord(name, 'lastModified')
    };
  }
}
```

## 📖 Best Practices

### Performance Optimization
- **Caching**: Cache resolved records
- **Batch Loading**: Load multiple records efficiently
- **Lazy Loading**: Load content on demand
- **CDN Integration**: Use gateways for faster access

### Security Considerations
- **Content Validation**: Verify content integrity
- **Access Control**: Private vs public records
- **Rate Limiting**: Prevent abuse
- **Backup Systems**: Content redundancy

### User Experience
- **Loading States**: Handle async operations gracefully
- **Error Boundaries**: Robust error handling
- **Progressive Enhancement**: Work without JavaScript
- **Accessibility**: Screen reader support

## ✅ Module Assessment

**Technical Challenge:**
Implement a complete ENS profile management system featuring:
- Text record CRUD operations
- Content hash management
- Avatar resolution system
- Batch update capabilities
- Error handling and recovery

**Evaluation Criteria:**
- Code functionality and correctness
- Error handling robustness
- Performance optimization
- User experience considerations
- Documentation quality

## 🔗 Resources & References

- [ENS Text Records](https://docs.ens.domains/dapp-developer-guide/resolving-names#text-records)
- [Content Hash Specification](https://eips.ethereum.org/EIPS/eip-1577)
- [IPFS Documentation](https://docs.ipfs.io/)
- [ENS Avatar Standard](https://docs.ens.domains/dapp-developer-guide/ens-avatar)
