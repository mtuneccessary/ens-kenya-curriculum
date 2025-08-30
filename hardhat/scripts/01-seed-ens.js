require('dotenv').config({ path: process.cwd() + '/.env' });
const { ethers } = require('ethers');

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const PUBLIC_RESOLVER = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';
const BASE_REGISTRAR = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85'; // Owner of 'eth' node in Registry

const REGISTRY_ABI = [
  'function owner(bytes32 node) view returns (address)',
  'function resolver(bytes32 node) view returns (address)',
  'function setResolver(bytes32 node, address resolver)',
  'function setSubnodeOwner(bytes32 node, bytes32 label, address owner)'
];

const RESOLVER_ABI = [
  'function addr(bytes32 node) view returns (address)',
  'function setAddr(bytes32 node, address addr)',
  'function text(bytes32 node, string key) view returns (string)',
  'function setText(bytes32 node, string key, string value)'
];

function namehash(name) {
  let node = ethers.constants.HashZero;
  if (name) {
    const labels = name.split('.').reverse();
    for (const label of labels) {
      node = ethers.utils.keccak256(
        ethers.utils.concat([
          ethers.utils.arrayify(node),
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label))
        ])
      );
    }
  }
  return node;
}

async function main() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY not set in .env');

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const userSigner = new ethers.Wallet(privateKey, provider);
  const user = await userSigner.getAddress();
  console.log('[i] Seeding ENS on local fork for:', user);

  const registryUser = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, userSigner);
  const registryRead = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, provider);
  const resolverUser = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_ABI, userSigner);

  const testLabel = process.env.SEED_NAME || 'kenya-dev-series';
  const fullName = `${testLabel}.eth`;
  const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(testLabel));
  const ethLabelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('eth'));
  const ethNode = ethers.utils.keccak256(
    ethers.utils.concat([
      ethers.utils.arrayify(ethers.constants.HashZero),
      ethers.utils.arrayify(ethLabelHash)
    ])
  );
  const node = namehash(fullName);

  // Verify current owner of 'eth' node (should be BaseRegistrar)
  const ethOwner = await registryRead.owner(ethNode);
  console.log('[i] eth node owner:', ethOwner);

  // Impersonate BaseRegistrar to create subnode under 'eth'
  console.log('[i] Impersonating BaseRegistrar to create subnode...');
  await provider.send('hardhat_impersonateAccount', [BASE_REGISTRAR]);
  await provider.send('hardhat_setBalance', [BASE_REGISTRAR, '0x21e19e0c9bab2400000']); // 1000 ETH
  const registrarSigner = provider.getSigner(BASE_REGISTRAR);
  const registryRegistrar = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, registrarSigner);

  const setSubTx = await registryRegistrar.setSubnodeOwner(ethNode, labelHash, user);
  await setSubTx.wait();
  console.log('[i] Subnode owner set for', fullName, '→', user);

  // Set resolver if not set
  const currentResolver = await registryRead.resolver(node);
  if (currentResolver.toLowerCase() !== PUBLIC_RESOLVER.toLowerCase()) {
    console.log('[i] Setting resolver to PublicResolver...');
    const setResolverTx = await registryUser.setResolver(node, PUBLIC_RESOLVER);
    await setResolverTx.wait();
  }

  // Set address
  console.log('[i] Setting addr record...');
  const setAddrTx = await resolverUser.setAddr(node, user);
  await setAddrTx.wait();

  // Set text records
  console.log('[i] Setting text records...');
  const texts = [
    ['email', 'devseries@enskenya.org'],
    ['url', 'https://ens.domains'],
    ['org.telegram', 'ens_kenya'],
    ['com.twitter', 'ensdomains']
  ];

  for (const [key, value] of texts) {
    const tx = await resolverUser.setText(node, key, value);
    await tx.wait();
  }

  console.log(`[✓] Seeded ${fullName} with resolver, address, and text records (via impersonation).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
