const config = require("../hardhat.config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying contracts...",
    deployer.address,
    (await deployer.getBalance()).toString()
  );

  const PaymentEscow = await ethers.getContractFactory("PaymentEscow");
  const paymentEscow = await PaymentEscow.deploy();
  console.log("PaymentEscow contract deployed to:", paymentEscow.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
