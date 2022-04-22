async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying contracts...",
    deployer.address,
    (await deployer.getBalance()).toString()
  );

  const PaymentEscow = await ethers.getContractFactory("PaymentEscow");
  const paymentEscow = await PaymentEscow.deploy('0xe6fd75ff38adca4b97fbcd938c86b98772431867');
  console.log("PaymentEscow contract deployed to:", paymentEscow.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
