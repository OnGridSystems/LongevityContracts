import EVMRevert from '../zeppelin-solidity/test/helpers/EVMRevert';

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Token = artifacts.require('LongevityToken');

contract('TokenRolesAndMinting', function (accounts) {

  beforeEach(async function () {
    this.token = await Token.new();
  });

  describe('owner who deployed contract', function () {
    it('should allow to finishMinting', async function () {
      const { logs } = await this.token.finishMinting().should.be.fulfilled;
      const event = logs.find(e => e.event === 'MintFinished');
      should.exist(event);
    });

    it('should reject to mint', async function () {
      await this.token.mint(accounts[9],123).should.be.rejectedWith(EVMRevert);
    });

    it('should allow to setMintTap', async function () {
      await this.token.setMintTap(99999999999999).should.be.fulfilled;
    });

    it('should allow to delMinter', async function () {
      await this.token.delMinter(accounts[0]).should.be.fulfilled;
    });

    it('should allow to addMinter', async function () {
      await this.token.addMinter(accounts[1]).should.be.fulfilled;
    });

    it('should allow to delOwner', async function () {
      await this.token.delOwner(accounts[0]).should.be.fulfilled;
    });

    it('should allow to addOwner', async function () {
      await this.token.addOwner(accounts[1]).should.be.fulfilled;
    });

    it('should allow to setCap', async function () {
      await this.token.setCap().should.be.fulfilled;
    });

    it('should allow to setMintTap', async function () {
      await this.token.setMintTap(99999999).should.be.fulfilled;
    });

    describe('being minter and having funds on its balance', function () {
      beforeEach(async function () {
        await this.token.addMinter(accounts[0]);
        await this.token.setMintTap(999999999999999999999999);
        await this.token.mint(accounts[0],1000);
      });

      it('should allow to mint', async function () {
        await this.token.mint(accounts[9],123).should.be.fulfilled;
      });

      it('should allow burning its own funds', async function () {
        await this.token.burn(100).should.be.fulfilled;
      });

      it('should allow transfer its own funds', async function () {
        await this.token.transfer(accounts[9],100).should.be.fulfilled;
      });

      it('should allow to setCap', async function () {
        await this.token.setCap().should.be.fulfilled;
      });

      it('should reject to setMintTap', async function () {
        await this.token.setMintTap(99999999).should.be.fulfilled;
      });

      describe('with minter privs revoked', function () {
        beforeEach(async function () {
          await this.token.delMinter(accounts[0]);
        });

        it('should reject to mint', async function () {
          await this.token.mint(accounts[9],123).should.be.rejectedWith(EVMRevert);
        });

        it('should allow burning its own funds', async function () {
          await this.token.burn(100).should.be.fulfilled;
        });

        it('should allow transfer its own funds', async function () {
          await this.token.transfer(accounts[9],100).should.be.fulfilled;
        });

        it('should allow to setCap', async function () {
          await this.token.setCap().should.be.fulfilled;
        });

        it('should reject to setMintTap', async function () {
          await this.token.setMintTap(99999999).should.be.fulfilled;
        });

      });
      describe('with owner privs revoked', function () {
        beforeEach(async function () {
          await this.token.delOwner(accounts[0]);
        });

        it('should reject to finishMinting', async function () {
          await this.token.finishMinting().should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setMintTap', async function () {
          await this.token.setMintTap(99999999999999).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to delMinter', async function () {
          await this.token.delMinter(accounts[0]).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to addMinter', async function () {
          await this.token.addMinter(accounts[1]).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to delOwner', async function () {
          await this.token.delOwner(accounts[0]).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to addOwner', async function () {
          await this.token.addOwner(accounts[1]).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setCap', async function () {
          await this.token.setCap().should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setMintTap', async function () {
          await this.token.setMintTap(99999999).should.be.rejectedWith(EVMRevert);
        });

        it('should allow burning its own funds', async function () {
          await this.token.burn(100).should.be.fulfilled;
        });

        it('should allow transfer its own funds', async function () {
          await this.token.transfer(accounts[9],100).should.be.fulfilled;
        });

        it('should get remaining Tap', async function () {
          await this.token.getTapRemaining().should.be.fulfilled;
        });
      });
    });
  });

  describe('initially unprivileged account', function () {

    it('should get remaining Tap', async function () {
      await this.token.getTapRemaining().should.be.fulfilled;
    });

    it('should reject to finishMinting', async function () {
      await this.token.finishMinting({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to mint', async function () {
      await this.token.mint(accounts[9],123,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to setMintTap', async function () {
      await this.token.setMintTap(99999999999999,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to delMinter', async function () {
      await this.token.delMinter(accounts[0],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to addMinter', async function () {
      await this.token.addMinter(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to delOwner', async function () {
      await this.token.delOwner(accounts[0],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to addOwner', async function () {
      await this.token.addOwner(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to setCap', async function () {
      await this.token.setCap({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('should reject to setMintTap', async function () {
      await this.token.setMintTap(99999999,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    describe('having funds on its balance', function () {
      beforeEach(async function () {
        await this.token.addMinter(accounts[0]);
        await this.token.setMintTap(999999999999999999999999);
        await this.token.mint(accounts[1],1000);
      });
      it('should allow burning its own funds', async function () {
        await this.token.burn(100,{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow transfer its own funds', async function () {
        await this.token.transfer(accounts[9],100,{from:accounts[1]}).should.be.fulfilled;
      });

      it('should reject to setCap', async function () {
        await this.token.setCap({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
      });

      it('should reject to setMintTap', async function () {
        await this.token.setMintTap(99999999, {from:accounts[1]}).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('after added to minters', function () {
      beforeEach(async function () {
        await this.token.addMinter(accounts[1]);
        await this.token.setMintTap(999999999999999999999999);
      });

      it('should allow to mint', async function () {
        await this.token.mint(accounts[9],123,{from:accounts[1]}).should.be.fulfilled;
      });

      it('should reject to finishMinting', async function () {
        await this.token.finishMinting({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
      });

      it('should reject to setMintTap', async function () {
        await this.token.setMintTap(99999999999999,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
      });

      it('should reject to delMinter', async function () {
        await this.token.delMinter(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
      });

      it('should reject to setCap', async function () {
        await this.token.setCap({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
      });

      it('should reject to setMintTap', async function () {
        await this.token.setMintTap(99999999, {from:accounts[1]}).should.be.rejectedWith(EVMRevert);
      });

      describe('then removed from minters', function () {
        beforeEach(async function () {
          await this.token.delMinter(accounts[1]);
        });

        it('should reject to mint', async function () {
          await this.token.mint(accounts[9],123,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to finishMinting', async function () {
          await this.token.finishMinting({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setMintTap', async function () {
          await this.token.setMintTap(99999999999999,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to delMinter', async function () {
          await this.token.delMinter(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setCap', async function () {
          await this.token.setCap({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setMintTap', async function () {
          await this.token.setMintTap(99999999, {from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

      });
    });

    describe('after added to owners', function () {
      beforeEach(async function () {
        await this.token.addOwner(accounts[1]);
      });

      it('should allow to finishMinting', async function () {
        const { logs } = await this.token.finishMinting({from:accounts[1]}).should.be.fulfilled;
        const event = logs.find(e => e.event === 'MintFinished');
        should.exist(event);
      });

      it('should allow to setMintTap', async function () {
        await this.token.setMintTap(99999999999999,{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to addMinter', async function () {
        await this.token.addMinter(accounts[1],{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to delMinter', async function () {
        await this.token.delMinter(accounts[1],{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to addOwner', async function () {
        await this.token.addOwner(accounts[1],{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to delOwner', async function () {
        await this.token.delOwner(accounts[1],{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to setCap', async function () {
        await this.token.setCap({from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to setMintTap', async function () {
        await this.token.setMintTap(99999999, {from:accounts[1]}).should.be.fulfilled;
      });

      describe('then removed from owners', function () {
        beforeEach(async function () {
          await this.token.delOwner(accounts[1]);
        });

        it('should reject to finishMinting', async function () {
          await this.token.finishMinting({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setMintTap', async function () {
          await this.token.setMintTap(99999999999999,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to delMinter', async function () {
          await this.token.delMinter(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to addMinter', async function () {
          await this.token.addMinter(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to addOwner', async function () {
          await this.token.addOwner(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to delOwner', async function () {
          await this.token.delOwner(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setCap', async function () {
          await this.token.setCap({from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to setMintTap', async function () {
          await this.token.setMintTap(99999999, {from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should get remaining Tap', async function () {
          await this.token.getTapRemaining().should.be.fulfilled;
        });
      });
    });

  });

  describe('while minting not finalized', function () {

    beforeEach(async function () {
      await this.token.addMinter(accounts[1]);
      await this.token.addMinter(accounts[0]);
      await this.token.setMintTap(999999999999999999999999);
    });

    it('should allow to mint from any account', async function () {
      await this.token.mint(accounts[9],123,{from:accounts[1]}).should.be.fulfilled;
      await this.token.mint(accounts[9],123,{from:accounts[0]}).should.be.fulfilled;
    });

    describe('after finalization', function () {

      beforeEach(async function () {
        await this.token.finishMinting();
      });

      it('should not allow to mint anymore', async function () {
        await this.token.mint(accounts[9],123,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        await this.token.mint(accounts[9],123,{from:accounts[0]}).should.be.rejectedWith(EVMRevert);
      });


    });

  });
});

/*
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
 */

