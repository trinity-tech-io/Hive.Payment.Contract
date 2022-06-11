const { ethers } = require("hardhat");
const { writeToFile } = require("../test/utils");
const config = require("../hardhat.config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Initializing contracts...", deployer.address, (await deployer.getBalance()).toString());

  const PaymentContract = await ethers.getContractFactory("HivePaymentV1");
  const paymentContract = PaymentContract.attach(config.contractAddress);
  const eventFilter = paymentContract.filters.OrderPay();
  const events = await paymentContract.queryFilter(eventFilter);
  const orders = [];
  
  for (let i = 0; i < events.length; i ++) {
    console.log(events.length, ' / ', i + 1)
    const from = events[i].args.from;
    const to = events[i].args.to;
    const amount = events[i].args.amount / 1e18;
    const orderId = events[i].args.orderId.toString();
    orders.push({from: from, to: to, amount: amount, orderId: orderId});
  }
  await writeToFile("orders.json", JSON.stringify(orders));
  console.log("Displaying paid orders  =====>>");
  console.log("Total count:", orders.length);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
