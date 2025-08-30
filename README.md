# ENS Developer Education Series: Kenya Edition

[![ENS](https://img.shields.io/badge/ENS-Ethereum_Name_Service-blue)](https://ens.domains)
[![Ethereum](https://img.shields.io/badge/Ethereum-Blockchain-black)](https://ethereum.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🌍 Empowering Kenyan Developers in Web3 Identity

A comprehensive 3-month technical curriculum designed to onboard 250+ Kenyan developers to Ethereum Name Service (ENS) technology through hands-on workshops and practical education.

## 🎯 Program Overview

### Mission
Transform Kenya's developer ecosystem by providing deep technical training in ENS integration, fostering grassroots adoption of decentralized identity solutions across East Africa.

### Impact Goals
- **250+ Developers Trained** in ENS architecture and smart contracts
- **30+ ENS Integrations** prototyped and deployed
- **6 Open-Source Modules** created for global replication
- **Regional Growth** foundation for East African ENS adoption

### Program Structure
```
3 Months | 6 Workshops | 3 Universities | 3 Cities
├── Month 1: Nairobi (University of Nairobi + Nairobi City)
├── Month 2: Nakuru (Egerton University + Nakuru City)  
└── Month 3: Mombasa (Pwani University + Mombasa City)
```

## 📚 Technical Curriculum

### Month 1: ENS Fundamentals & Domain Management
#### Module 01: ENS Smart Contract Fundamentals
- ENS Registry and Resolver contracts
- Name resolution process
- Gas optimization techniques
- Contract interaction patterns

#### Module 02: Domain Registration & Management
- .eth domain registration flow
- Renewal and expiration management
- Ownership transfers
- Bulk operations

### Month 2: Advanced Features & Subdomains
#### Module 03: Text Records, Content Hashes & Avatars
- Text record management
- Content hash linking (IPFS)
- Avatar integration
- Metadata standards

#### Module 04: Subdomain Delegation & Management
- Subdomain creation and delegation
- Permission models
- Community systems
- DAO integration

### Month 3: Web3 Identity & Integration
#### Module 05: Web3 Identity Flows & dApp UX
- ENS-powered authentication
- Identity verification
- User interface design
- Mobile optimization

#### Module 06: Advanced Integration & Deployment
- Production deployment
- Cross-platform compatibility
- Performance optimization
- Security best practices

## 🚀 Quick Start

### Local Mainnet Fork (Recommended for Development)
1. Copy env: `cp .env.example .env` and set `MAINNET_RPC_URL` (Alchemy/Infura)
2. Start node: `npm run fork:start` (keep this terminal running)
3. Seed ENS: `npm run fork:seed` (in another terminal)
4. Run examples: they default to `RPC_URL=http://127.0.0.1:8545`

See `docs/LOCAL_FORK.md` for full details.

### Prerequisites
- Node.js 14+
- Basic JavaScript/TypeScript
- Web3 wallet (MetaMask)
- Git

### Setup Development Environment
```bash
# Clone the curriculum
git clone https://github.com/ensdomains/developer-education-series.git
cd developer-education-series

# Install dependencies
npm install

# Set up local blockchain (optional)
npm run setup-local

# Start development server
npm run dev
```

### Run First Example
```bash
# Navigate to Module 01
cd curriculum/modules/01-ens-fundamentals/examples

# Install dependencies
npm install

# Run basic ENS interaction
npm start

# Run advanced operations
npm run advanced
```

## 🛠 Technical Architecture

### Core Technologies
- **Ethereum**: Smart contract blockchain
- **ENS Contracts**: Domain registration system
- **Ethers.js**: Ethereum JavaScript library
- **IPFS**: Decentralized content storage
- **React/Vue**: Frontend frameworks

### Development Tools
- **Hardhat**: Smart contract development
- **Infura/Alchemy**: RPC providers
- **MetaMask**: Wallet integration
- **VS Code**: IDE with ENS extensions

## 📖 Documentation

### Getting Started
- [Curriculum Overview](./curriculum/README.md)
- [Technical Prerequisites](./docs/prerequisites.md)
- [Environment Setup](./docs/setup.md)

### Module Guides
- [Module 01: ENS Fundamentals](./curriculum/modules/01-ens-fundamentals/README.md)
- [Module 02: Domain Management](./curriculum/modules/02-domain-management/README.md)
- [Module 03: Text Records & Content](./curriculum/modules/03-text-records-content/workshop-content.md)
- [Module 04: Subdomain Delegation](./curriculum/modules/04-subdomain-delegation/workshop-outline.md)
- [Module 05: Web3 Identity](./curriculum/modules/05-web3-identity/workshop-framework.md)

### Workshop Materials
- [Facilitator Guides](./workshops/)
- [Code Examples](./examples/)
- [Assessment Framework](./docs/assessment.md)

## 🎓 Learning Path

### Beginner Friendly
1. **ENS Basics** - Contract interaction, name resolution
2. **Domain Registration** - Registration flow, cost management
3. **Profile Building** - Text records, avatars, content linking

### Intermediate Level
4. **Subdomain Systems** - Delegation, permission models, community management
5. **Authentication Flows** - Login systems, identity verification
6. **dApp Integration** - User interfaces, UX patterns

### Advanced Topics
7. **Scalable Architecture** - Bulk operations, enterprise patterns
8. **Production Deployment** - Security, optimization, monitoring
9. **Cross-platform Development** - Mobile, web, multi-chain

## 🌟 Key Features

### ✅ Hands-on Learning
- **Interactive Code Examples** - Ready-to-run ENS integrations
- **Live Workshops** - Guided implementation sessions
- **Practical Projects** - Real-world application development

### ✅ Comprehensive Coverage
- **Smart Contract Deep Dives** - ENS Registry, Resolver, Registrar
- **User Experience Focus** - Authentication, interfaces, mobile
- **Production Ready** - Security, optimization, deployment

### ✅ Community Driven
- **Open Source Materials** - Freely available curriculum
- **Regional Adaptation** - Kenya-specific examples
- **Local Language Support** - Swahili documentation

## 🤝 Community & Support

### Get Involved
- **Discord Community** - Real-time discussions and support
- **GitHub Issues** - Bug reports and feature requests
- **Pull Requests** - Contribute improvements
- **Local Meetups** - Nairobi, Nakuru, Mombasa

### Support Channels
- **Technical Questions** - ENS Discord #dev-support
- **Workshop Help** - Facilitator guides and troubleshooting
- **Community Forums** - Peer-to-peer learning and collaboration

## 📊 Impact & Metrics

### Program Success
- **Participant Growth**: 250+ developers trained
- **Project Output**: 30+ ENS integrations created
- **Open Source**: 6 modules publicly released
- **Regional Reach**: 3 cities, 3 universities

### Community Metrics
- **GitHub Stars**: Curriculum repository engagement
- **Discord Members**: Active community size
- **Workshop Attendance**: Participation rates
- **Project Deployments**: Live ENS integrations

## 🌍 Regional Expansion

### East African Vision
- **Kenya Hub**: Primary implementation and testing
- **Regional Replication**: Uganda, Tanzania, Rwanda
- **Cross-border Collaboration**: Shared resources and expertise
- **Cultural Adaptation**: Context-appropriate content

### Global Potential
- **Curriculum Adaptation**: Reusable for other regions
- **Multi-language Support**: Translation infrastructure
- **Cultural Localization**: Region-specific examples
- **Partnership Model**: University and community collaboration

## 🏢 Partnership Opportunities

### Academic Institutions
- **Curriculum Integration** - University course inclusion
- **Research Collaboration** - ENS academic projects
- **Student Programs** - Internships and fellowships

### Industry Partners
- **Mentorship Programs** - Industry expert involvement
- **Career Development** - ENS-focused job opportunities
- **Project Sponsorship** - Real-world integration funding

### Government & NGO
- **Digital Identity** - National ID integration discussions
- **Youth Development** - Tech education initiatives
- **Economic Growth** - Blockchain industry development

## 📄 License & Usage

### Open Source
This curriculum is released under the **MIT License**, allowing:
- Free use for educational purposes
- Modification and adaptation
- Commercial implementation
- Redistribution with attribution

### Attribution
When using this curriculum, please credit:
```
ENS Developer Education Series - Kenya Edition
Built with support from ENS Foundation
```

## 🙏 Acknowledgments

### Core Team
- **ENS Foundation** - Technical and financial support
- **Kenyan Developer Community** - Local expertise and guidance
- **University Partners** - Academic collaboration and venues

### Contributors
- **Open Source Community** - Code contributions and improvements
- **Beta Testers** - Curriculum validation and feedback
- **Workshop Facilitators** - Hands-on implementation support

### Special Thanks
- **Ethereum Kenya** - Community building and networking
- **Local Tech Companies** - Industry partnerships and mentorship
- **Educational Institutions** - Academic collaboration and student access

---

## 🚀 Join the Movement

**Ready to build the future of decentralized identity in East Africa?**

### For Developers
- Start with [Module 01](./curriculum/modules/01-ens-fundamentals/)
- Join our [Discord Community](https://discord.gg/ens)
- Attend local workshops and meetups

### For Organizations
- Partner with us for regional expansion
- Sponsor developer education initiatives
- Integrate ENS in your products and services

### For Universities
- Adopt curriculum in computer science programs
- Host workshops and guest lectures
- Collaborate on ENS research projects

---

**ENS Developer Education Series - Kenya Edition**  
*Building decentralized identity, empowering developers, transforming communities*  

🌐 [ens.domains](https://ens.domains) | 🐙 [GitHub](https://github.com/ensdomains) | 💬 [Discord](https://discord.gg/ens) | 🐦 [Twitter](https://twitter.com/ensdomains)
