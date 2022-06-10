const { ethers } = require("hardhat");
const config = require("../hardhat.config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Initializing contracts...", deployer.address, (await deployer.getBalance()).toString());

  const PaymentContract = await ethers.getContractFactory("HivePaymentV1");
  const paymentContract = PaymentContract.attach(config.contractAddress);
  const platformFeeInfo = await paymentContract.getPlatformFee();
  console.log("Displaying platform fee config  =====>>");
  console.log("Platform Address: ", platformFeeInfo.platformAddress);
  console.log("Platform Fee Rate: ", platformFeeInfo.platformFeeRate);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
