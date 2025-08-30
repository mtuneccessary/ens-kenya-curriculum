import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: process.cwd() + "/.env" });

// ENS mainnet addresses
const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const PUBLIC_RESOLVER = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41";
const BASE_REGISTRAR = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
const ETH_REGISTRAR_CONTROLLER = "0x253553366Da8546fC250F225fe3d25d0C782303b";

// Minimal ABIs
const REGISTRY_ABI = [
  "function owner(bytes32 node) view returns (address)",
  "function resolver(bytes32 node) view returns (address)",
  "function setResolver(bytes32 node, address resolver)",
  "function setSubnodeOwner(bytes32 node, bytes32 label, address owner)"
];

const RESOLVER_ABI = [
  "function addr(bytes32 node) view returns (address)",
  "function setAddr(bytes32 node, address addr)",
  "function text(bytes32 node, string key) view returns (string)",
  "function setText(bytes32 node, string key, string value)"
];

const CONTROLLER_ABI = [
  "function available(string name) view returns (bool)",
  "function rentPrice(string name, uint256 duration) view returns (uint256)",
  "function makeCommitment(string name, address owner, bytes32 secret) pure returns (bytes32)",
  "function commit(bytes32 commitment)",
  "function register(string name, address owner, uint256 duration, bytes32 secret) payable"
];

function namehash(name: string): string {
  let node = ethers.constants.HashZero;
  if (name) {
    const labels = name.split(".").reverse();
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
  const [signer] = await ethers.getSigners();
  const owner = await signer.getAddress();

  console.log("[i] Seeding ENS on local fork as:", owner);

  const provider = ethers.provider;

  const registry = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, signer);
  const resolver = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_ABI, signer);
  const controller = new ethers.Contract(ETH_REGISTRAR_CONTROLLER, CONTROLLER_ABI, signer);

  const testName = process.env.SEED_NAME || "kenya-dev-series"; // kenya-dev-series.eth
  const years = Number(process.env.SEED_YEARS || 1);
  const duration = years * 365 * 24 * 60 * 60;

  console.log(`[i] Preparing to register: ${testName}.eth for ${years} year(s)`);

  const available = await controller.available(testName);
  console.log("[i] Available:", available);

  const secret = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const commitment = await controller.makeCommitment(testName, owner, secret);

  console.log("[i] Submitting commitment...");
  const commitTx = await controller.commit(commitment);
  await commitTx.wait();

  console.log("[i] Waiting minimum commitment age (simulate 60s)...");
  await provider.send("evm_increaseTime", [61]);
  await provider.send("evm_mine", []);

  const price = await controller.rentPrice(testName, duration);
  console.log("[i] Rent price (ETH):", ethers.utils.formatEther(price));

  console.log("[i] Registering name...");
  const registerTx = await controller.register(testName, owner, duration, secret, { value: price });
  const registerReceipt = await registerTx.wait();
  console.log("[i] Registered:", registerReceipt.transactionHash);

  const node = namehash(`${testName}.eth`);

  // Set public resolver if not set
  const currentResolver = await registry.resolver(node);
  if (currentResolver.toLowerCase() !== PUBLIC_RESOLVER.toLowerCase()) {
    console.log("[i] Setting resolver to PublicResolver...");
    const setResolverTx = await registry.setResolver(node, PUBLIC_RESOLVER);
    await setResolverTx.wait();
  }

  // Set address record
  console.log("[i] Setting addr record...");
  const setAddrTx = await resolver.setAddr(node, owner);
  await setAddrTx.wait();

  // Set a few text records
  console.log("[i] Setting text records...");
  const texts: Array<[string, string]> = [
    ["email", "devseries@enskenya.org"],
    ["url", "https://ens.domains"],
    ["org.telegram", "ens_kenya"],
    ["com.twitter", "ensdomains"],
  ];

  for (const [key, value] of texts) {
    const tx = await resolver.setText(node, key, value);
    await tx.wait();
  }

  console.log(`[✓] Seeded ${testName}.eth with resolver, address, and text records.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
