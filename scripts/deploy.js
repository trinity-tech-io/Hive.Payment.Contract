const config = require("../hardhat.config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying contracts...",
    deployer.address,
    (await deployer.getBalance()).toString()
  );

  const HivePayment = await ethers.getContractFactory("HivePaymentV1");
  const hivePayment = await HivePayment.deploy();
  console.log("HivePaymentV1 contract deployed to:", hivePayment.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
