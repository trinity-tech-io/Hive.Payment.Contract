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
        payment = await PaymentEscow.deploy('0xe6fd75ff38adca4b97fbcd938c86b98772431867');
        await payment.deployed();
    });

    describe("Deployments", function() {
        it("Should be able to pay order", async function () {
            await expect(payment.connect(addr1).payOrder(0, '0x0000000000000000000000000000000000000000', "first payment order")).to.be.revertedWith("PaymentEscow: can not transfer less than 0");
            await expect(payment.connect(addr1).payOrder(1000, '0x0000000000000000000000000000000000000000', "first payment order")).to.be.revertedWith("PaymentEscow: invalid receiver address");
            await expect(payment.connect(addr1).payOrder(0, addr2.address, "first payment order")).to.be.revertedWith("PaymentEscow: can not transfer less than 0");
            // expect(await payment.connect(addr1).payOrder(1, addr2.address, "first payment order")).to.be.equal(0);
            // expect(await payment.connect(owner).payOrder(1, addr1.address, "second payment order")).to.be.equal(1);
            // get order
            await expect(payment.connect(addr1).getOrder(2)).to.be.revertedWith("PaymentEscow: invalid orderId");
            // expect(await payment.connect(owner).getOrder(0)).to.be.equal(await payment.connect(addr1).getOrder(0));
            // expect(await payment.connect(addr2).getOrder(1)).to.be.equal(await payment.connect(addr1).getOrder(1));
            // const addr1Order = await payment.getOrder(0);
            // expect(addr1Order.orderId).to.be.equal(0);
            // expect(addr1Order.orderId).to.be.equal(0);

            
        });
    });
});
