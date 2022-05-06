const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MetERC20Token Contract", function () {
    let PaymentEscow;
    let payment;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    before(async function () {
        PaymentEscow = await ethers.getContractFactory("PaymentEscow");
    });

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        payment = await PaymentEscow.deploy();
        await payment.deployed();
    });

    describe("Deployments", function() {
        it("Should be able to pay order", async function () {
            const addrZero = '0x0000000000000000000000000000000000000000';
            const firstOrderMemo = "first payment order";
            const secondOrderMemo = "second payment order";
            // check input value
            await expect(payment.connect(addr1).payOrder(0, addrZero, firstOrderMemo)).to.be.revertedWith("PaymentEscow: can not transfer less than 0");
            await expect(payment.connect(addr1).payOrder(1000, addrZero, firstOrderMemo)).to.be.revertedWith("PaymentEscow: invalid receiver address");
            await expect(payment.connect(addr1).payOrder(0, addr2.address, firstOrderMemo)).to.be.revertedWith("PaymentEscow: can not transfer less than 0");
            // pay order
            expect(await payment.connect(addr1).payOrder(1, addr2.address, firstOrderMemo)).to.be.equal(0);
            expect(await payment.connect(owner).payOrder(1, addr1.address, secondOrderMemo)).to.be.equal(1);
        });

        it("Should be able to get order", async function () {
            const firstOrderAmount = 1;
            const firstOrderMemo = "first payment order";
            const secondOrderAmount = 2;
            const secondOrderMemo = "second payment order";
            
            // ================ pay order ================ //
            expect(await payment.connect(addr1).payOrder(firstOrderAmount, addr2.address, firstOrderMemo)).to.be.equal(0);
            expect(await payment.connect(owner).payOrder(secondOrderAmount, addr1.address, secondOrderMemo)).to.be.equal(1);

            // ================ get order ================ //
            // check input orderId
            await expect(payment.connect(addr1).getOrder(2)).to.be.revertedWith("PaymentEscow: invalid orderId");
            // check if getOrder depend on caller
            expect(await payment.connect(owner).getOrder(0)).to.be.equal(await payment.connect(addr1).getOrder(0));
            expect(await payment.connect(addr2).getOrder(1)).to.be.equal(await payment.connect(addr1).getOrder(1));
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
            const addrZero = '0x0000000000000000000000000000000000000000';
            const firstOrderAmount = 1;
            const firstOrderMemo = "first payment order";
            const secondOrderAmount = 2;
            const secondOrderMemo = "second payment order";
            const thirdOrderAmount = 3;
            const thirdOrderMemo = "third payment order";
            // ================ pay order ================ //
            expect(await payment.connect(addr1).payOrder(firstOrderAmount, addr2.address, firstOrderMemo)).to.be.equal(0);
            expect(await payment.connect(owner).payOrder(secondOrderAmount, addr1.address, secondOrderMemo)).to.be.equal(1);
            expect(await payment.connect(addr1).payOrder(thirdOrderAmount, owner.address, thirdOrderMemo)).to.be.equal(2);

            // ================ get orders ================ //
            // check input address
            await expect(payment.connect(addr1).getOrders(addrZero)).to.be.revertedWith("PaymentEscow: invalid address");
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
    });
});
