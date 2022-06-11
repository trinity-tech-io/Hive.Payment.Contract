const { ethers } = require("hardhat");
const config = require("../hardhat.config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Initializing contracts...", deployer.address, (await deployer.getBalance()).toString());

  const from = config.testAddress1;
  const to = config.testAddress2;
  const platform = config.testAddress3;
  const balanceFrom = await ethers.provider.getBalance(from);
  const balanceTo = await ethers.provider.getBalance(to);
  const balancePlatform = await ethers.provider.getBalance(platform);
  console.log("Displaying balnce of accounts  =====>>");
  console.log(`Balance of ${from}: ${balanceFrom / 1e18}`);
  console.log(`Balance of ${to}: ${balanceTo / 1e18}`);
  console.log(`Balance of ${platform}: ${balancePlatform / 1e18}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
