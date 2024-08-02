/** @format */

const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // 1 million tokens with 18 decimals
  const Token = await ethers.getContractFactory('EGG');
  const token = await Token.deploy();

  console.log('Token deployed to:', token.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
