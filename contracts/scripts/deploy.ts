import { ethers } from "hardhat";

async function main() {
  console.log("Deploying UniqueTreasure...");

  const UniqueTreasure = await ethers.getContractFactory("UniqueTreasure");
  const contract = await UniqueTreasure.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`UniqueTreasure deployed to: ${address}`);
  console.log(`\nVerify with:\nnpx hardhat verify --network sepolia ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

