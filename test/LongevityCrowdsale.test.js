import ether from '../zeppelin-solidity/test/helpers/ether';
import { advanceBlock } from '../zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../zeppelin-solidity/test/helpers/increaseTime';
import latestTime from '../zeppelin-solidity/test/helpers/latestTime';
import EVMRevert from '../zeppelin-solidity/test/helpers/EVMRevert';

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CrowdSale = artifacts.require('LongevityCrowdsale.sol');
const Token = artifacts.require('LongevityToken.sol');
const PriceOracle = artifacts.require('../mocks/PriceOracleMock.sol');

contract('LongevityCrowdsale', function (accounts) {

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();

    this.phase0StartTime = latestTime() + duration.weeks(1);
    this.phase0EndTime = this.phase0StartTime + duration.weeks(1);
    this.phase0Discount = 40;
    this.phase1StartTime = this.phase0EndTime + 1;
    this.phase1EndTime = this.phase1StartTime + duration.weeks(1);
    this.phase1Discount = 35;
    this.phase2StartTime = this.phase1EndTime + 1;
    this.phase2EndTime = this.phase2StartTime + duration.weeks(1);
    this.phase2Discount = 30;

  });

  beforeEach(async function () {
    this.oracle = await PriceOracle.new(45678);
    this.tkn = await Token.new();
    this.cs = await CrowdSale.new(this.tkn.address, this.oracle.address);
    await this.tkn.addMinter(this.cs.address);
    await this.tkn.setMintTap(99999999999999999);
    //this.token.addMinter(this.crowdsale);

    /*
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1);

    this.crowdsale = await Crowdsale.new(this.startTime, this.endTime, rate, wallet);

    this.token = Token.at(await this.crowdsale.token());
    */
  });

  it('should be able to get price from oracle', async function () {
    //const price = await this.oracle.priceUSDcETH();
    const price = await this.cs.getPriceUSDcETH();
    price.should.be.bignumber.equal(45678);
  });

  describe('while phase list is empty', function () {
    it('should reject payments', async function () {
      await this.cs.send(ether(1)).should.be.rejectedWith(EVMRevert);
      await this.cs.buyTokens(accounts[3], { from: accounts[0], value: ether(1) }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('after phases added', function () {
    beforeEach(async function () {
      await this.cs.addPhase(this.phase0StartTime, this.phase0EndTime, this.phase0Discount);
      await this.cs.addPhase(this.phase1StartTime, this.phase1EndTime, this.phase1Discount);
      await this.cs.addPhase(this.phase2StartTime, this.phase2EndTime, this.phase2Discount);
    });
    it('validatePhaseDates for different combinations', async function () {
      (await this.cs.validatePhaseDates(1500000000, 1500000000)).should.be.equal(false);
      (await this.cs.validatePhaseDates(1500000001, 1500000000)).should.be.equal(false);
      (await this.cs.validatePhaseDates(1500000000, 1500000001)).should.be.equal(true);
      (await this.cs.validatePhaseDates(this.phase0StartTime + 1, this.phase0EndTime - 1)).should.be.equal(false);
      (await this.cs.validatePhaseDates(this.phase0EndTime - 1, this.phase1StartTime + 1)).should.be.equal(false);
      (await this.cs.validatePhaseDates(1500000000, this.phase1StartTime + 1)).should.be.equal(false);
    });
    it('should reject payments before phase 0 start', async function () {
      await this.cs.send(ether(1)).should.be.rejectedWith(EVMRevert);
      await this.cs.buyTokens(accounts[3], { from: accounts[0], value: ether(1) }).should.be.rejectedWith(EVMRevert);
    });
    it('should reject offchain purchase for non-cashiers', async function () {
      await this.cs.offChainPurchase(accounts[0], 10000, 1000, { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
    });
    it('validate discount percent for each phase', async function () {
      (await this.cs.getDiscountPercent(this.phase0StartTime)).should.be.bignumber.equal(40);
      (await this.cs.getDiscountPercent(this.phase0EndTime)).should.be.bignumber.equal(40);
      (await this.cs.getDiscountPercent(this.phase1StartTime)).should.be.bignumber.equal(35);
      (await this.cs.getDiscountPercent(this.phase1EndTime)).should.be.bignumber.equal(35);
      (await this.cs.getDiscountPercent(this.phase2StartTime)).should.be.bignumber.equal(30);
      (await this.cs.getDiscountPercent(this.phase2EndTime)).should.be.bignumber.equal(30);
    });

    describe('after cashier added', function () {
      beforeEach(async function () {
        await this.cs.addCashier(accounts[0]);
      });
      it('should allow offchain purchase', async function () {
        const USDcRaisedBefore = await this.cs.USDcRaised();
        const { logs } = await this.cs.offChainPurchase(accounts[0], 9876, 56789, { from: accounts[0] }).should.be.fulfilled;
        const event = logs.find(e => e.event === 'OffChainTokenPurchase');
        should.exist(event);
        event.args.tokensSold.should.be.bignumber.equal(9876);
        event.args.USDcAmount.should.be.bignumber.equal(56789);
        const USDcRaisedAfter = await this.cs.USDcRaised();
        USDcRaisedAfter.minus(USDcRaisedBefore).should.be.bignumber.equal(56789);
      });
      it('should reject offchain purchase for non-cashiers', async function () {
        await this.cs.offChainPurchase(accounts[0], 10000, 1000, { from: accounts[1] }).should.be.rejectedWith(EVMRevert);
      });
      describe('after cashier revoked', function () {
        beforeEach(async function () {
          await this.cs.delCashier(accounts[0]);
        });
        it('should reject offchain purchase', async function () {
          await this.cs.offChainPurchase(accounts[0], 10000, 1000, { from: accounts[0] }).should.be.rejectedWith(EVMRevert);
        });
      });
    });

    describe('after phase0 started', function () {
      before(async function () {
        await increaseTimeTo(this.phase0StartTime);
      });
      it('should reject payments less than 10USD', async function () {
        await this.cs.send(ether(0.0218)).should.be.rejectedWith(EVMRevert);
        await this.cs.buyTokens(accounts[3], { from: accounts[0], value: ether(0.0218) }).should.be.rejectedWith(EVMRevert);
      });
      it('should reject zero value transactions', async function () {
        await this.cs.send().should.be.rejectedWith(EVMRevert);
        await this.cs.buyTokens(accounts[3], { from: accounts[0]}).should.be.rejectedWith(EVMRevert);
      });
      it('should accept payments 10USD and more', async function () {
        await this.cs.send(ether(0.0219)).should.be.fulfilled;
      });
      describe('with default single sink wallet', function () {
        it('should accept payments, split and mint correct amount of tokens', async function () {
          var sinkWallet = accounts[0];
          var beneficiary = accounts[4];
          var sinkWalletBalanceBefore = web3.eth.getBalance(sinkWallet);
          await this.cs.sendTransaction({ value: ether(1), from: beneficiary }).should.be.fulfilled;
          var sinkWalletBalanceAfter = web3.eth.getBalance(sinkWallet);
          sinkWalletBalanceAfter.minus(sinkWalletBalanceBefore).should.be.bignumber.equal(ether(1));
        });
      });
      describe('with two sink wallets', function () {
        beforeEach(async function () {
          await this.cs.addWallet(accounts[1]);
        });
        it('check view functions', async function () {
          const discountPercent = await this.cs.getCurrentDiscountPercent();
          discountPercent.should.be.bignumber.equal(40);
          const USDcValue = await this.cs.calculateUSDcValue(ether(1));
          USDcValue.should.be.bignumber.equal(45678);
          const tokensCalculated = await this.cs.calculateTokenAmount(ether(1),discountPercent);
          tokensCalculated.should.be.bignumber.equal(7613000);
        });
        it('should accept payments, split and mint correct amount of tokens', async function () {
          const sinkWallet0 = accounts[0];
          const sinkWallet1 = accounts[1];
          const beneficiary = accounts[4];
          const sinkWallet0BalanceBefore = web3.eth.getBalance(sinkWallet0);
          const sinkWallet1BalanceBefore = web3.eth.getBalance(sinkWallet1);
          const beneficiaryTokensBefore = await this.tkn.balanceOf(beneficiary);
          const USDcRaisedBefore = await this.cs.USDcRaised();
          const weiRaisedBefore = await this.cs.weiRaised();
          const { logs } = await this.cs.sendTransaction({ value: ether(1), from: beneficiary }).should.be.fulfilled;
          const event = logs.find(e => e.event === 'TokenPurchase');
          should.exist(event);
          event.args.amount.should.be.bignumber.equal(7613000);
          event.args.value.should.be.bignumber.equal(ether(1));
          event.args.discountPercent.should.be.bignumber.equal(40);
          const beneficiaryTokensAfter = await this.tkn.balanceOf(beneficiary);
          const tokensIssued = beneficiaryTokensAfter.minus(beneficiaryTokensBefore);
          tokensIssued.should.be.bignumber.equal(7613000);
          const USDcRaisedAfter = await this.cs.USDcRaised();
          const weiRaisedAfter = await this.cs.weiRaised();
          USDcRaisedAfter.minus(USDcRaisedBefore).should.be.bignumber.equal(45678);
          weiRaisedAfter.minus(weiRaisedBefore).should.be.bignumber.equal(ether(1));
          const sinkWallet0BalanceAfter = web3.eth.getBalance(sinkWallet0);
          const sinkWallet1BalanceAfter = web3.eth.getBalance(sinkWallet1);
          sinkWallet0BalanceAfter.minus(sinkWallet0BalanceBefore).should.be.bignumber.equal(ether(0.5));
          sinkWallet1BalanceAfter.minus(sinkWallet1BalanceBefore).should.be.bignumber.equal(ether(0.5));
        });
      });
    });
    describe('after phase1 started', function () {
      before(async function () {
        await increaseTimeTo(this.phase1StartTime);
      });
      describe('with three sink wallets', function () {
        beforeEach(async function () {
          await this.cs.addWallet(accounts[1]);
          await this.cs.addWallet(accounts[2]);
          await this.cs.addWallet(accounts[3]);
          await this.cs.delWallet(0);
        });
        it('check view functions', async function () {
          const discountPercent = await this.cs.getCurrentDiscountPercent();
          discountPercent.should.be.bignumber.equal(35);
          const USDcValue = await this.cs.calculateUSDcValue(ether(1));
          USDcValue.should.be.bignumber.equal(45678);
          const tokensCalculated = await this.cs.calculateTokenAmount(ether(1),discountPercent);
          tokensCalculated.should.be.bignumber.equal(7027384);
        });
        it('should accept payments, split and mint correct amount of tokens', async function () {
          const sinkWallet1 = accounts[1];
          const sinkWallet2 = accounts[2];
          const sinkWallet3 = accounts[3];
          const beneficiary = accounts[4];
          const sinkWallet1BalanceBefore = web3.eth.getBalance(sinkWallet1);
          const sinkWallet2BalanceBefore = web3.eth.getBalance(sinkWallet2);
          const sinkWallet3BalanceBefore = web3.eth.getBalance(sinkWallet3);
          const beneficiaryTokensBefore = await this.tkn.balanceOf(beneficiary);
          const USDcRaisedBefore = await this.cs.USDcRaised();
          const weiRaisedBefore = await this.cs.weiRaised();
          const { logs } = await this.cs.sendTransaction({ value: ether(1), from: beneficiary }).should.be.fulfilled;
          const event = logs.find(e => e.event === 'TokenPurchase');
          should.exist(event);
          event.args.amount.should.be.bignumber.equal(7027384);
          event.args.value.should.be.bignumber.equal(ether(1));
          event.args.discountPercent.should.be.bignumber.equal(35);
          const beneficiaryTokensAfter = await this.tkn.balanceOf(beneficiary);
          const tokensIssued = beneficiaryTokensAfter.minus(beneficiaryTokensBefore);
          tokensIssued.should.be.bignumber.equal(7027384);
          const USDcRaisedAfter = await this.cs.USDcRaised();
          const weiRaisedAfter = await this.cs.weiRaised();
          USDcRaisedAfter.minus(USDcRaisedBefore).should.be.bignumber.equal(45678);
          weiRaisedAfter.minus(weiRaisedBefore).should.be.bignumber.equal(ether(1));
          const sinkWallet1BalanceAfter = web3.eth.getBalance(sinkWallet1);
          const sinkWallet2BalanceAfter = web3.eth.getBalance(sinkWallet2);
          const sinkWallet3BalanceAfter = web3.eth.getBalance(sinkWallet3);
          const sinkWallet1Increase = sinkWallet1BalanceAfter.minus(sinkWallet1BalanceBefore);
          const sinkWallet2Increase = sinkWallet2BalanceAfter.minus(sinkWallet2BalanceBefore);
          const sinkWallet3Increase = sinkWallet3BalanceAfter.minus(sinkWallet3BalanceBefore);
          sinkWallet1Increase.should.be.bignumber.equal(sinkWallet2Increase);
          sinkWallet1Increase.plus(sinkWallet2Increase).plus(sinkWallet3Increase).should.be.bignumber.equal(ether(1));
        });
        describe('phase1 (current) deleted', function () {
        beforeEach(async function () {
          await this.cs.delPhase(1);
        });
        it('should reject payments', async function () {
          await this.cs.sendTransaction({ value: ether(1)}).should.be.rejectedWith(EVMRevert);
          await this.cs.buyTokens(accounts[3], { from: accounts[0], value: ether(1) }).should.be.rejectedWith(EVMRevert);
        });
        describe('phase1 re-added', function () {
          beforeEach(async function () {
            await this.cs.addPhase(this.phase1StartTime, this.phase1EndTime, this.phase1Discount);
          });
          it('check view functions', async function () {
            const discountPercent = await this.cs.getCurrentDiscountPercent();
            discountPercent.should.be.bignumber.equal(35);
            const USDcValue = await this.cs.calculateUSDcValue(ether(1));
            USDcValue.should.be.bignumber.equal(45678);
            const tokensCalculated = await this.cs.calculateTokenAmount(ether(1),discountPercent);
            tokensCalculated.should.be.bignumber.equal(7027384);
          });
          it('should accept payments, split and mint correct amount of tokens', async function () {
            const sinkWallet1 = accounts[1];
            const sinkWallet2 = accounts[2];
            const sinkWallet3 = accounts[3];
            const beneficiary = accounts[4];
            const sinkWallet1BalanceBefore = web3.eth.getBalance(sinkWallet1);
            const sinkWallet2BalanceBefore = web3.eth.getBalance(sinkWallet2);
            const sinkWallet3BalanceBefore = web3.eth.getBalance(sinkWallet3);
            const beneficiaryTokensBefore = await this.tkn.balanceOf(beneficiary);
            const USDcRaisedBefore = await this.cs.USDcRaised();
            const weiRaisedBefore = await this.cs.weiRaised();
            const { logs } = await this.cs.sendTransaction({ value: ether(1), from: beneficiary }).should.be.fulfilled;
            const event = logs.find(e => e.event === 'TokenPurchase');
            should.exist(event);
            event.args.amount.should.be.bignumber.equal(7027384);
            event.args.value.should.be.bignumber.equal(ether(1));
            event.args.discountPercent.should.be.bignumber.equal(35);
            const beneficiaryTokensAfter = await this.tkn.balanceOf(beneficiary);
            const tokensIssued = beneficiaryTokensAfter.minus(beneficiaryTokensBefore);
            tokensIssued.should.be.bignumber.equal(7027384);
            const USDcRaisedAfter = await this.cs.USDcRaised();
            const weiRaisedAfter = await this.cs.weiRaised();
            USDcRaisedAfter.minus(USDcRaisedBefore).should.be.bignumber.equal(45678);
            weiRaisedAfter.minus(weiRaisedBefore).should.be.bignumber.equal(ether(1));
            const sinkWallet1BalanceAfter = web3.eth.getBalance(sinkWallet1);
            const sinkWallet2BalanceAfter = web3.eth.getBalance(sinkWallet2);
            const sinkWallet3BalanceAfter = web3.eth.getBalance(sinkWallet3);
            const sinkWallet1Increase = sinkWallet1BalanceAfter.minus(sinkWallet1BalanceBefore);
            const sinkWallet2Increase = sinkWallet2BalanceAfter.minus(sinkWallet2BalanceBefore);
            const sinkWallet3Increase = sinkWallet3BalanceAfter.minus(sinkWallet3BalanceBefore);
            sinkWallet1Increase.should.be.bignumber.equal(sinkWallet2Increase);
            sinkWallet1Increase.plus(sinkWallet2Increase).plus(sinkWallet3Increase).should.be.bignumber.equal(ether(1));
          });
        });
      });
      });
    });


    describe('at the last moment of phase 2', function () {
      before(async function () {
        await increaseTimeTo(this.phase2EndTime - 10);
      });
      it('should accept payments', async function () {
        await this.cs.sendTransaction({ value: ether(1)}).should.be.fulfilled;
        //await this.cs.buyTokens(accounts[3], { from: accounts[0], value: ether(1) }).should.be.fulfilled;
      });
    });
    describe('after phase2 finished', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.phase2EndTime + 100);
      });
      it('should reject payments', async function () {
        await this.cs.sendTransaction({ value: ether(1)}).should.be.rejectedWith(EVMRevert);
        await this.cs.buyTokens(accounts[3], { from: accounts[0], value: ether(1) }).should.be.rejectedWith(EVMRevert);
      });
    });
  });

  describe('migrate to another oracle', function () {
    beforeEach(async function () {
      this.newOracle = await PriceOracle.new(87654);
    });
    it('non-owner shouldnt be able to change oracle', async function () {
      await this.cs.setOracle(this.newOracle.address,{from: accounts[1]}).should.be.rejectedWith(EVMRevert);
    });
    it('owner should be able to set new oracle', async function () {
      const { logs } = await this.cs.setOracle(this.newOracle.address).should.be.fulfilled;
      const event = logs.find(e => e.event === 'OracleChanged');
      should.exist(event);
    });
    describe('after oracle changed', function () {
      beforeEach(async function () {
        await this.cs.setOracle(this.newOracle.address)
      });
      it('check view functions', async function () {
        const USDcValue = await this.cs.calculateUSDcValue(ether(1));
        USDcValue.should.be.bignumber.equal(87654);
        const USDcPrice = await this.cs.getPriceUSDcETH();
        USDcPrice.should.be.bignumber.equal(87654);
      });
    });
  });

  describe('ownership tests', function () {
    beforeEach(async function () {
      await this.cs.addCashier(accounts[7]);
      await this.cs.addWallet(accounts[6]);
      await this.cs.addWallet(accounts[7]);
      await this.cs.addPhase(this.phase0StartTime, this.phase0EndTime, this.phase0Discount);
    });
    describe('before ownership granted', function () {
      it('shouldnt allow to set oracle', async function () {
        await this.cs.setOracle(accounts[0],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to add owner', async function () {
        await this.cs.addOwner(accounts[5],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to del owner', async function () {
        await this.cs.delOwner(accounts[0],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to addCashier', async function () {
        await this.cs.addCashier(accounts[5],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to delCashier', async function () {
        await this.cs.delCashier(accounts[7],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to addWallet', async function () {
        await this.cs.addWallet(accounts[5],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to delWallet', async function () {
        await this.cs.delWallet(0,{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to addPhase', async function () {
        await this.cs.addPhase(1500000000, 1500000001, 23 ,{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
      it('shouldnt allow to delPhase', async function () {
        await this.cs.delPhase(0 ,{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
      });
    });
    describe('after ownership granted', function () {
      beforeEach(async function () {
        await this.cs.addOwner(accounts[5]);
      });
      it('should allow to set oracle', async function () {
        await this.cs.setOracle(accounts[0],{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to add owner', async function () {
        await this.cs.addOwner(accounts[5],{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to del owner', async function () {
        await this.cs.delOwner(accounts[0],{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to addCashier', async function () {
        await this.cs.addCashier(accounts[5],{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to delCashier', async function () {
        await this.cs.delCashier(accounts[7],{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to addWallet', async function () {
        await this.cs.addWallet(accounts[5],{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to delWallet', async function () {
        await this.cs.delWallet(0,{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to addPhase', async function () {
        await this.cs.addPhase(1500000000, 1500000001, 23 ,{ from: accounts[5] }).should.be.fulfilled;
      });
      it('should allow to delPhase', async function () {
        await this.cs.delPhase(0 ,{ from: accounts[5] }).should.be.fulfilled;
      });
      describe('then revoked', function () {
        beforeEach(async function () {
          await this.cs.delOwner(accounts[5]);
        });
        it('shouldnt allow to set oracle', async function () {
          await this.cs.setOracle(accounts[0],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to add owner', async function () {
          await this.cs.addOwner(accounts[5],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to del owner', async function () {
          await this.cs.delOwner(accounts[0],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to addCashier', async function () {
          await this.cs.addCashier(accounts[5],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to delCashier', async function () {
          await this.cs.delCashier(accounts[7],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to addWallet', async function () {
          await this.cs.addWallet(accounts[5],{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to delWallet', async function () {
          await this.cs.delWallet(0,{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to addPhase', async function () {
          await this.cs.addPhase(1500000000, 1500000001, 23 ,{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
        it('shouldnt allow to delPhase', async function () {
          await this.cs.delPhase(0 ,{ from: accounts[5] }).should.be.rejectedWith(EVMRevert);
        });
      });
    });
  });

  /*
  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasEnded();
    ended.should.equal(false);
    await increaseTimeTo(this.afterEndTime);
    ended = await this.crowdsale.hasEnded();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime);
      await this.crowdsale.send(value).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('high-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });

      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.send(value);
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });

  describe('low-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });

      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });
  */
});
