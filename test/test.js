const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { getEvent } = require("./utils");
const config = require("../hardhat.config");
const { BigNumber } = require("ethers");

describe("HivePaymentV1 Contract", function () {
    let HivePaymentV1;
    let payment;
    let owner;
    let platform;
    let feeRate;
    let addr1;
    let addr2;
    let addrs;

    before(async function () {
        HivePaymentV1 = await ethers.getContractFactory("HivePaymentV1");
    });

    beforeEach(async function () {
        [owner, platform, addr1, addr2, ...addrs] = await ethers.getSigners();
        feeRate = 5;
        payment = await HivePaymentV1.deploy(platform.address, feeRate);
        await payment.deployed();
    });

    describe("Deployments", function() {
        it("Should be able to pay order", async function () {
            const firstOrderMemo = "first payment order";
            const firstOrderAmount = parseEther('1');
            const secondOrderMemo = "second payment order";
            const secondOrderAmount = parseEther('0.01');
            // check input value
            await expect(payment.connect(addr1).payOrder(ethers.constants.AddressZero, firstOrderMemo, { value: parseEther('0') })).to.be.revertedWith("HivePaymentV1: can not transfer less than 0");
            await expect(payment.connect(addr1).payOrder(ethers.constants.AddressZero, firstOrderMemo, { value: parseEther('1') })).to.be.revertedWith("HivePaymentV1: invalid receiver address");
            await expect(payment.connect(addr1).payOrder(addr2.address, firstOrderMemo, { value: parseEther('0') })).to.be.revertedWith("HivePaymentV1: can not transfer less than 0");
            // check platform fee config
            const platformInfo = await payment.getPlatformFee();
            expect(platformInfo.platformAddress).to.be.equal(platform.address);
            expect(platformInfo.platformFeeRate).to.be.equal(feeRate);
            // pay order

            // check balance
            const provider = ethers.provider;
            let preBalalnceAddr1 = await provider.getBalance(addr1.address);
            let preBalalnceAddr2 = await provider.getBalance(addr2.address);
            let preBalalncePlat = await provider.getBalance(platform.address);
            await expect(payment.connect(addr1).payOrder(addr2.address, firstOrderMemo, { value: firstOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, addr2.address, firstOrderAmount, 0);
            console.log("Consumption: ", (preBalalnceAddr1).sub(await provider.getBalance(addr1.address)).sub(firstOrderAmount));
            expect((await provider.getBalance(addr2.address)).sub(preBalalnceAddr2)).to.be.equal(firstOrderAmount.mul(100 - feeRate).div(100));
            expect((await provider.getBalance(platform.address)).sub(preBalalncePlat)).to.be.equal(firstOrderAmount.mul(feeRate).div(100));
            // check balance
            let preBalalnceOwner = await provider.getBalance(owner.address);
            preBalalnceAddr1 = await provider.getBalance(addr1.address);
            preBalalncePlat = await provider.getBalance(platform.address);
            await expect(payment.connect(owner).payOrder(addr1.address, secondOrderMemo, { value: secondOrderAmount })).to.emit(payment, 'OrderPay').withArgs(owner.address, addr1.address, secondOrderAmount, 1);
            console.log("Consumption: ", (preBalalnceOwner).sub(await provider.getBalance(owner.address)).sub(secondOrderAmount));
            expect((await provider.getBalance(addr1.address)).sub(preBalalnceAddr1)).to.be.equal(secondOrderAmount.mul(100 - feeRate).div(100));
            expect((await provider.getBalance(platform.address)).sub(preBalalncePlat)).to.be.equal(secondOrderAmount.mul(feeRate).div(100));
        });

        it("Should be able to get order", async function () {
            const firstOrderAmount = parseEther('1');
            const firstOrderMemo = "first payment order";
            const secondOrderAmount = parseEther('0.01');
            const secondOrderMemo = "second payment order";

            // ================ pay order ================ //
            await expect(payment.connect(addr1).payOrder(addr2.address, firstOrderMemo, { value: firstOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, addr2.address, firstOrderAmount, 0);
            await expect(payment.connect(owner).payOrder(addr1.address, secondOrderMemo, { value: secondOrderAmount })).to.emit(payment, 'OrderPay').withArgs(owner.address, addr1.address, secondOrderAmount, 1);
            
            // ================ get order ================ //
            // check input orderId
            await expect(payment.connect(addr1).getOrder(2)).to.be.revertedWith("HivePaymentV1: invalid orderId");
            // check if getOrder depend on caller
            expect((await payment.connect(owner).getOrder(0)).orderId).to.be.equal((await payment.connect(addr1).getOrder(0)).orderId);
            expect((await payment.connect(addr2).getOrder(1)).orderId).to.be.equal((await payment.connect(addr1).getOrder(1)).orderId);
            // check retreived orderInfo
                // first: addr1 => addr2 : firstOrderAmount , firstOrderMemo
            const firstOrder = await payment.getOrder(0);
            expect(firstOrder.orderId).to.be.equal(0);
            expect(firstOrder.amount).to.be.equal(firstOrderAmount);
            expect(firstOrder.to).to.be.equal(addr2.address);
            expect(firstOrder.memo).to.be.equal(firstOrderMemo);
                // first: owner => addr1 : secondOrderAmount , secondOrderMemo
            const secondOrder = await payment.getOrder(1);
            expect(secondOrder.orderId).to.be.equal(1);
            expect(secondOrder.amount).to.be.equal(secondOrderAmount);
            expect(secondOrder.to).to.be.equal(addr1.address);
            expect(secondOrder.memo).to.be.equal(secondOrderMemo);
        });

        it("Should be able to get orders", async function () {
            const firstOrderAmount = parseEther('1');
            const firstOrderMemo = "first payment order";
            const secondOrderAmount = parseEther('0.01');
            const secondOrderMemo = "second payment order";
            const thirdOrderAmount = parseEther('2.1');
            const thirdOrderMemo = "third payment order";
            // ================ pay order ================ //
            await expect(payment.connect(addr1).payOrder(addr2.address, firstOrderMemo, { value: firstOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, addr2.address, firstOrderAmount, 0);
            await expect(payment.connect(owner).payOrder(addr1.address, secondOrderMemo, { value: secondOrderAmount })).to.emit(payment, 'OrderPay').withArgs(owner.address, addr1.address, secondOrderAmount, 1);
            await expect(payment.connect(addr1).payOrder(owner.address, thirdOrderMemo, { value: thirdOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, owner.address, thirdOrderAmount, 2);

            // ================ get orders ================ //
            // check input address
            await expect(payment.connect(addr1).getOrders(ethers.constants.AddressZero)).to.be.revertedWith("HivePaymentV1: invalid address");
            // check if getOrders depend on caller
            expect((await payment.connect(owner).getOrders(addr1.address)).length).to.be.equal(2);
            expect((await payment.connect(addr1).getOrders(addr1.address)).length).to.be.equal(2);
            expect((await payment.connect(addr2).getOrders(addr1.address)).length).to.be.equal(2);
            // check retreived orderInfos
                // addr1 orders
            const addr1Orders = await payment.getOrders(addr1.address);
            expect(addr1Orders.length).to.be.equal(2);
            expect(addr1Orders[0].orderId).to.be.equal(0);
            expect(addr1Orders[0].amount).to.be.equal(firstOrderAmount);
            expect(addr1Orders[0].to).to.be.equal(addr2.address);
            expect(addr1Orders[0].memo).to.be.equal(firstOrderMemo);

            expect(addr1Orders[1].orderId).to.be.equal(2);
            expect(addr1Orders[1].amount).to.be.equal(thirdOrderAmount);
            expect(addr1Orders[1].to).to.be.equal(owner.address);
            expect(addr1Orders[1].memo).to.be.equal(thirdOrderMemo);
                // owner orders
            const ownerOrders = await payment.getOrders(owner.address);
            expect(ownerOrders.length).to.be.equal(1);
            expect(ownerOrders[0].orderId).to.be.equal(1);
            expect(ownerOrders[0].amount).to.be.equal(secondOrderAmount);
            expect(ownerOrders[0].to).to.be.equal(addr1.address);
            expect(ownerOrders[0].memo).to.be.equal(secondOrderMemo);
        });

        it("Should be able to get order by address", async function () {
            const firstOrderAmount = parseEther('1');
            const firstOrderMemo = "first payment order";
            const secondOrderAmount = parseEther('0.01');
            const secondOrderMemo = "second payment order";
            const thirdOrderAmount = parseEther('2.1');
            const thirdOrderMemo = "third payment order";
            // ================ pay order ================ //
            await expect(payment.connect(addr1).payOrder(addr2.address, firstOrderMemo, { value: firstOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, addr2.address, firstOrderAmount, 0);
            await expect(payment.connect(owner).payOrder(addr1.address, secondOrderMemo, { value: secondOrderAmount })).to.emit(payment, 'OrderPay').withArgs(owner.address, addr1.address, secondOrderAmount, 1);
            await expect(payment.connect(addr1).payOrder(owner.address, thirdOrderMemo, { value: thirdOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, owner.address, thirdOrderAmount, 2);

            // ================ get orders ================ //
            // check input address
            await expect(payment.connect(addr1).getOrderByAddress(ethers.constants.AddressZero, 2)).to.be.revertedWith("HivePaymentV1: invalid address");
            await expect(payment.connect(addr1).getOrderByAddress(ethers.constants.AddressZero, 0)).to.be.revertedWith("HivePaymentV1: invalid address");
            await expect(payment.connect(addr1).getOrderByAddress(addr1.address, 2)).to.be.revertedWith("HivePaymentV1: invalid orderId");
            // check if getOrders depend on caller
            expect((await payment.connect(owner).getOrderByAddress(addr1.address, 0)).orderId).to.be.equal((await payment.connect(addr1).getOrderByAddress(addr1.address, 0)).orderId);
            expect((await payment.connect(addr2).getOrderByAddress(addr1.address, 1)).orderId).to.be.equal((await payment.connect(addr1).getOrderByAddress(addr1.address, 1)).orderId);
            expect((await payment.connect(addr2).getOrderByAddress(owner.address, 0)).orderId).to.be.equal((await payment.connect(owner).getOrderByAddress(owner.address, 0)).orderId);
            // check retreived orderInfos
            const firstOrder = await payment.getOrderByAddress(addr1.address, 0);
            expect(firstOrder.orderId).to.be.equal(0);
            expect(firstOrder.amount).to.be.equal(firstOrderAmount);
            expect(firstOrder.to).to.be.equal(addr2.address);
            expect(firstOrder.memo).to.be.equal(firstOrderMemo);

            const thirdOrder = await payment.getOrderByAddress(addr1.address, 1);
            expect(thirdOrder.orderId).to.be.equal(2);
            expect(thirdOrder.amount).to.be.equal(thirdOrderAmount);
            expect(thirdOrder.to).to.be.equal(owner.address);
            expect(thirdOrder.memo).to.be.equal(thirdOrderMemo);

            const secondOrder = await payment.getOrderByAddress(owner.address, 0);
            expect(secondOrder.orderId).to.be.equal(1);
            expect(secondOrder.amount).to.be.equal(secondOrderAmount);
            expect(secondOrder.to).to.be.equal(addr1.address);
            expect(secondOrder.memo).to.be.equal(secondOrderMemo);
        });

        it("Should be able to get order count by address", async function () {
            const firstOrderAmount = parseEther('1');
            const firstOrderMemo = "first payment order";
            const secondOrderAmount = parseEther('0.01');
            const secondOrderMemo = "second payment order";
            const thirdOrderAmount = parseEther('2.1');
            const thirdOrderMemo = "third payment order";
            // ================ pay order ================ //
            await expect(payment.connect(addr1).payOrder(addr2.address, firstOrderMemo, { value: firstOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, addr2.address, firstOrderAmount, 0);
            await expect(payment.connect(owner).payOrder(addr1.address, secondOrderMemo, { value: secondOrderAmount })).to.emit(payment, 'OrderPay').withArgs(owner.address, addr1.address, secondOrderAmount, 1);
            await expect(payment.connect(addr1).payOrder(owner.address, thirdOrderMemo, { value: thirdOrderAmount })).to.emit(payment, 'OrderPay').withArgs(addr1.address, owner.address, thirdOrderAmount, 2);

            // ================ get orders ================ //
            // check input address
            await expect(payment.connect(addr1).getOrderCountByAddress(ethers.constants.AddressZero)).to.be.revertedWith("HivePaymentV1: invalid address");
            // check if getOrders depend on caller
            expect(await payment.connect(owner).getOrderCountByAddress(addr1.address)).to.be.equal(await payment.connect(addr1).getOrderCountByAddress(addr1.address));
            expect(await payment.connect(addr2).getOrderCountByAddress(owner.address)).to.be.equal(await payment.connect(addr1).getOrderCountByAddress(owner.address));
            // check retreived orderInfos
            expect(await payment.getOrderCountByAddress(addr1.address)).to.be.equal((await payment.getOrders(addr1.address)).length);
            expect(await payment.getOrderCountByAddress(owner.address)).to.be.equal((await payment.getOrders(owner.address)).length);

            expect(await payment.getOrderCountByAddress(addr1.address)).to.be.equal(2);
            expect(await payment.getOrderCountByAddress(owner.address)).to.be.equal(1);
        });

        it("Should be able to set / get platform fee", async function () {
            // check initial platform fee config set by constructor
            const initPlatformInfo = await payment.getPlatformFee();
            expect(initPlatformInfo.platformAddress).to.be.equal(platform.address);
            expect(initPlatformInfo.platformFeeRate).to.be.equal(feeRate);

            // check input value
            await expect(payment.connect(addr1).setPlatformFee(ethers.constants.AddressZero, 0)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(payment.connect(platform).setPlatformFee(addr1.address, 0)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(payment.connect(addr2).setPlatformFee(addr1.address, 101)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(payment.connect(owner).setPlatformFee(ethers.constants.AddressZero, 0)).to.be.revertedWith("HivePaymentV1: invalid platform address");
            await expect(payment.connect(owner).setPlatformFee(ethers.constants.AddressZero, 101)).to.be.revertedWith("HivePaymentV1: invalid platform address");
            await expect(payment.connect(owner).setPlatformFee(addr1.address, 101)).to.be.revertedWith("HivePaymentV1: invalid platform fee rate");

            // set platform fee config
            await expect(payment.connect(owner).setPlatformFee(addr2.address, 10)).to.emit(payment, 'PlatformFeeChanged').withArgs(addr2.address, 10);
            
            // check updated platform fee config
            const updatedPlatformInfo = await payment.getPlatformFee();
            expect(updatedPlatformInfo.platformAddress).to.be.equal(addr2.address);
            expect(updatedPlatformInfo.platformFeeRate).to.be.equal(10);
        });
    });
});
