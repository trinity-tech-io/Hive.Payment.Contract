const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const config = require("../hardhat.config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Initializing contracts...", deployer.address, (await deployer.getBalance()).toString());

  const PaymentContract = await ethers.getContractFactory("HivePaymentV1");
  const paymentContract = PaymentContract.attach(config.contractAddress);
  const initPlatformFeeInfo = await paymentContract.getPlatformFee();
  console.log("Initial Platform Address: ", initPlatformFeeInfo.platformAddress, " Fee: ", initPlatformFeeInfo.platformFeeRate);
  console.log("");

  const addr1 = config.testAddress1;
  const addr2 = config.testAddress2;
  const txAmount = parseEther('0.1');
 
  const preBal1 = await ethers.provider.getBalance(addr1);
  const preBal2 = await ethers.provider.getBalance(addr2);
  const preBalPlat = await ethers.provider.getBalance(initPlatformFeeInfo.platformAddress);

  // pay order  (owner ===> addr2 : txAmount) 
  await paymentContract.payOrder(addr2, "first payment order test", {value: txAmount});

  await hre.run("delay", { time: 10 });
  const aftBal1 = await ethers.provider.getBalance(addr1);
  const aftBal2 = await ethers.provider.getBalance(addr2);
  const aftBalPlat = await ethers.provider.getBalance(initPlatformFeeInfo.platformAddress);
  console.log(`Pay order: Tx Amount ===>> ${txAmount / 1e18}`)
  console.log(`Address1: ${preBal1 / 1e18} ===>> ${aftBal1 / 1e18} // ${(aftBal1 - preBal1) / 1e18}`);
  console.log(`Address2: ${preBal2 / 1e18} ===>> ${aftBal2 / 1e18} // ${(aftBal2 - preBal2) / 1e18}`);
  console.log(`Platform: ${preBalPlat / 1e18} ===>> ${aftBalPlat / 1e18} // ${(aftBalPlat - preBalPlat) / 1e18}`);
  console.log("");

  // check platform fee again
  const intPlatformFeeInfo = await paymentContract.getPlatformFee();
  expect(intPlatformFeeInfo.platformAddress).to.be.equal(initPlatformFeeInfo.platformAddress);
  expect(intPlatformFeeInfo.platformFeeRate).to.be.equal(initPlatformFeeInfo.platformFeeRate);

  

  // update platform fee
  const updatedFeeRate = initPlatformFeeInfo.platformFeeRate.add(1);
  const updatedAddress = addr2;
  await paymentContract.setPlatformFee(updatedAddress, updatedFeeRate);
  await hre.run("delay", { time: 5 });
  const updatedPlatformFeeInfo = await paymentContract.getPlatformFee();
  expect(updatedPlatformFeeInfo.platformAddress).to.be.equal(updatedAddress);
  expect(updatedPlatformFeeInfo.platformFeeRate).to.be.equal(updatedFeeRate);

  console.log("Updated Platform Address: ", updatedPlatformFeeInfo.platformAddress, " Fee: ", updatedPlatformFeeInfo.platformFeeRate);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
