
var LongevityToken = artifacts.require('LongevityToken');
var LongevityCrowdsale = artifacts.require("LongevityCrowdsale");

contract('LongevityCrowdsale', function (accounts) {
    it('Wallets initialized', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.wallets.call(0);
        }).then(function (result) {
            assert.equal(result, accounts[0]);
        });
    });
    it('Owner is msg sender', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.owners.call(accounts[0]);
        }).then(function (result) {
            assert.equal(result, true);
        });
    });
    it('Check initial phases is 0', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.totalPhases();
        }).then(function (result) {
            assert.equal(result, 0);
        });
    });
    it('Change phase total to 2', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.setTotalPhases(2);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'TotalPhasesChanged');
        });
    });
    it('Check total phases is 2', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.totalPhases();
        }).then(function (result) {
            assert.equal(result, 2);
        });
    });
    it('Set phase 0x0 to 1520000000, 1539999999, 40', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.setPhase(0, 1520000000, 1539999999, 40);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'SetPhase');
        });
    });
    it('Check phase 0x0 value is 40', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getBonusPercent(1520000000);
        }).then(function (result) {
            assert.equal(result, 40);
        });
    });
    it('Delete phase 0x0', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.delPhase(0);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'DelPhase');
        });
    });
    it('Set phase 0x0 to 1520000000, 1539999999, 40', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.setPhase(0, 1520000000, 1539999999, 40);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'SetPhase');
        });
    });
    it('Check phase 0x0 value is 40', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getBonusPercent(1520000000);
        }).then(function (result) {
            assert.equal(result, 40);
        });
    });
    it('Set phase 0x1 to 1540000000, 1553000000, 30', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.setPhase(1, 1540000000, 1553000000, 30);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'SetPhase');
        });
    });
    it('Check phase 0x1 value is 30', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getBonusPercent(1540000000);
        }).then(function (result) {
            assert.equal(result, 30);
        });
    });
    it('Discount equals 40% for 0 phase', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getBonusPercent(1520000000);
        }).then(function (result) {
            assert.equal(result, 40);
        });
    });
    it('Discount equals 30% for 1 phase', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getBonusPercent(1540000000);
        }).then(function (result) {
            assert.equal(result, 30);
        });
    });
    it('calculateUSDcValue with view function for 0.2356151 Ether', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.calculateUSDcValue(0.2356151 * 1e18);
        }).then(function (result) {
            assert.equal(result, 30788);
        });
    });
    it('calculateTokenAmount with view function for 0.2356151 Ether (with bonus)', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.calculateTokenAmount(0.2356151 * 1e18, 45);
        }).then(function (result) {
            assert.equal(result, 44642);
        });
    });
    it('Check rate equals initial', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getPriceUSDcETH();
        }).then(function (result) {
            assert.equal(result, 130671);
        });
    });
    it('Check weiRaised == 0', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.weiRaised();
        }).then(function (result) {
            assert.equal(result, 0);
        });
    });
    it('Send less than 100 USD to fallback function', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.sendTransaction({value: 757627935808251, gas: 300000});
        }).then(assert.fail).catch(function (error) {
            assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'revert must be returned')
        });
    });
    it('Send more than 100 USD to fallback function', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.sendTransaction({value: 76569678407350600, gas: 300000});
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'TokenPurchase');
        });
    });
    it('Non-owner prohibited to update wallet', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.addWallet(accounts[3], {from: accounts[1]});
        }).then(assert.fail).catch(function (error) {
            assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'revert must be returned')
        });
    });
    it('Wallet collecting ethers not changed after err update', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getWalletsCount();
        }).then(function (result) {
            assert.equal(result, 1);
        });
    });
    it('Owner is able to update wallet', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.addWallet(accounts[3]);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'WalletAdded');
        });
    });
    it('Wallet collecting ethers changed after update by Owner', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.wallets.call(1);
        }).then(function (result) {
            assert.equal(result, accounts[3]);
        });
    });
    it('USD raised changed after payment receive', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.USDcRaised.call();
        }).then(function (result) {
            assert.equal(result.toString(), 10005);
        });
    });
    it('Delete wallet', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.delWallet(0);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'WalletRemoved');
        });
    });
    it('Non-owner prohibited to add Cashier', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.addCashier(accounts[5], {from: accounts[1]});
        }).then(assert.fail).catch(function (error) {
            assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'revert must be returned')
        });
    });
    it('Non-cashier unable to do offChainPurchase including owner', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.offChainPurchase(accounts[7], 100, 1, {from: accounts[0]});
        }).then(assert.fail).catch(function (error) {
            assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'revert must be returned')
        });
    });
    it('Non-cashier unable to do offChainPurchase', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.offChainPurchase(accounts[7], 100, 1, {from: accounts[5]});
        }).then(assert.fail).catch(function (error) {
            assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'revert must be returned')
        });
    });
    it('Owner is able to add Acc5 as a Cashier', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.addCashier(accounts[5]);
        }).then(function (result) {
            assert.equal(result['logs'][0]['event'], 'CashierAdded');
        });
    });
    it('Wallets list decrease', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.getWalletsCount();
        }).then(function (result) {
            assert.equal(result, 1);
        });
    });
    it('First wallet in list changed', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.wallets.call(0);
        }).then(function (result) {
            assert.equal(result, accounts[3]);
        });
    });
    it('Non-owner unable to finalize Crowdsale', function () {
        return LongevityCrowdsale.deployed().then(function (instance) {
            return instance.finalizeCrowdsale(accounts[4], {from: accounts[8]});
        }).then(assert.fail).catch(function (error) {
            assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'revert must be returned')
        });
    });
    it('Non-owner unable to change oracle', function () {
    return LongevityCrowdsale.deployed().then(function (instance) {
      return instance.setOracle("0xdeadbeef", {from: accounts[8]});
    }).then(assert.fail).catch(function (error) {
      assert.isAbove(error.message.search('VM Exception while processing transaction'), -1, 'revert must be returned')
    });
  });
});

/*
 */
