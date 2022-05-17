const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe ("Loan Contract",  function () {
  let wallet, owner, borrower, lender;
  let amount= 100000;
  let interest = 1000;
  let duration = 1;
  beforeEach(async () => {
     [owner, borrower, lender] = await ethers.getSigners();
    const Loan = await ethers.getContractFactory("Loancontract");
     wallet = await Loan.deploy(amount, interest, duration, borrower.address, lender.address);
    await wallet.deployed();
  });
   
    it("Should have correct amount", async function () {
    const amount = await wallet.amount();
    expect(amount).to.equal(amount);
    });

    it('Should NOT accept fund if not lender', async () => {
        await expect(wallet.makefund()).to.be.revertedWith("Only lender have permit");
    });

    it('Should NOT accept fund if not exact amount', async () => {
        await expect(wallet.connect(lender).makefund()).to.be.revertedWith("Amount must be exact");
    });
    it('Should accept fund', async () => {
        await wallet.connect(lender).makefund({value: amount});
        const state = await wallet.state();
        expect(state).to.equal(1);
    });

    it('Should NOT reimburse if not lender', async () => {
        await expect(wallet.rembuirse()).to.be.revertedWith("Only borrower have permit");
    });

    it('Should NOT reimburse if not exact amount', async () => {
      await expect(wallet.connect(borrower).rembuirse()).to.be.revertedWith("Amount must be exact");
    });

    it('Should NOT reimburse if loan hasnt matured yet', async () => {
      await wallet.connect(lender).makefund({value: amount});
       await expect(wallet.connect(borrower).rembuirse({value: amount+interest})).to.be.revertedWith("Loan has not matured yet");
    });

    it('Should reimburse', async () => {
      await wallet.connect(lender).makefund({value: amount});
      setTimeout(async () => {
        await wallet.connect(borrower).rembuirse({value: amount+interest});
        const state = await wallet.state();
        expect(state).to.equal(2);
      }, duration*10000);
    });
});