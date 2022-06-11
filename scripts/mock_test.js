const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
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
  const txAmount = parseEther('5');
 
  const preBal1 = await ethers.provider.getBalance(addr1);
  const preBal2 = await ethers.provider.getBalance(addr2);
  const preBalPlat = await ethers.provider.getBalance(initPlatformFeeInfo.platformAddress);
  await paymentContract.payOrder(addr2, "first payment order test", {value: txAmount});
  

  // check platform fee
  const intPlatformFeeInfo = await paymentContract.getPlatformFee();
  expect(intPlatformFeeInfo.platformAddress).to.be.equal(initPlatformFeeInfo.platformAddress);
  expect(intPlatformFeeInfo.platformFeeRate).to.be.equal(initPlatformFeeInfo.platformFeeRate);

  const aftBal1 = await ethers.provider.getBalance(addr1);
  const aftBal2 = await ethers.provider.getBalance(addr2);
  const aftBalPlat = await ethers.provider.getBalance(initPlatformFeeInfo.platformAddress);
  console.log(`Pay order: Tx Amount ===>> ${txAmount}`)
  console.log(`Address1: ${preBal1} ===>> ${aftBal1} // -${preBal1.sub(aftBal1)}`);
  console.log(`Address2: ${preBal2} ===>> ${aftBal2} // ${aftBal2.sub(preBal2)}`);
  console.log(`Platform: ${preBalPlat} ===>> ${aftBalPlat} // ${aftBalPlat.sub(preBalPlat)}`);
  console.log("");

  // update platform fee
  const updatedFeeRate = initPlatformFeeInfo.platformFeeRate.add(1);
  const updatedAddress = addr2;
  await paymentContract.setPlatformFee(updatedAddress, updatedFeeRate);
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
