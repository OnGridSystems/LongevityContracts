from ethereum.tester import TransactionFailed
import time


def test_longevity_deploy(web3, accounts, chain):
    token, _ = chain.provider.get_or_deploy_contract('LongevityToken')

    deploy_args = (
        token.address,
        130671
    )
    crowdsale, _ = chain.provider.get_or_deploy_contract('LongevityCrowdsale', deploy_args=deploy_args)

    assert crowdsale.call().owners(web3.eth.coinbase), 'Coinbase must be owner'


def test_longevity_payable(web3, accounts, chain):
    token, _ = chain.provider.get_or_deploy_contract('LongevityToken')

    deploy_args = (
        token.address,
        130671
    )
    crowdsale, _ = chain.provider.get_or_deploy_contract('LongevityCrowdsale', deploy_args=deploy_args)
    # assert token.call().minters(crowdsale.address) is False

    token.transact().addMinter(crowdsale.address)
    token.transact().addMinter(accounts[0])

    # assert token.call().minters(crowdsale.address)

    # add phase
    crowdsale.transact().setTotalPhases(1)

    cs_tx = crowdsale.transact().setPhase(0, 0, 10000000000000000000, 50)
    chain.wait.for_receipt(cs_tx)

    assert crowdsale.call().isInPhase(int(time.time()))

    assert crowdsale.call().getBonusPercent(int(time.time())) == 50

    assert crowdsale.call().calculateUSDcValue(76569678407350600) == 10005

    assert crowdsale.call().calculateTokenAmount(76569678407350600, 50) == 15007

    assert token.call().mintingFinished() is False

    assert token.call().getTapRemaining() == 0

    token.transact().setMintTap(10000000)

    # token.transact().mint(accounts[2], 15007)

    cs_tx = crowdsale.transact({'value': 76569678407350600, 'from': accounts[3], 'gas': 4000000}).buyTokens(accounts[3])
    chain.wait.for_receipt(cs_tx)
    assert token.call().balanceOf(accounts[3]) == 15007

    assert token.call().totalSupply() == 15007

    assert crowdsale.call().weiRaised() == 76569678407350600
    assert crowdsale.call().USDcRaised() == 10005

    crowdsale.transact({'value': 76569678407350900, 'from': accounts[5], 'gas': 4000000}).buyTokens(accounts[5])
    assert token.call().balanceOf(accounts[5]) == 15007
    assert token.call().totalSupply() == 30014
    assert crowdsale.call().weiRaised() == 76569678407350600 + 76569678407350900
    assert crowdsale.call().USDcRaised() == 30015




def test_finalize(web3, accounts, chain):
    token, _ = chain.provider.get_or_deploy_contract('LongevityToken')

    deploy_args = (
        token.address,
        130671
    )
    crowdsale, _ = chain.provider.get_or_deploy_contract('LongevityCrowdsale', deploy_args=deploy_args)

    # add phase
    crowdsale.transact().setTotalPhases(1)
    cs_tx = crowdsale.transact().setPhase(0, 0, 10000000000000000000, 50)
    chain.wait.for_receipt(cs_tx)
    # add minter
    token.transact().addMinter(crowdsale.address)
    token.transact().addMinter(accounts[0])
    # add owner
    token.transact().addOwner(crowdsale.address)
    # init tap
    token.transact().setMintTap(10000000)

    cs_tx = crowdsale.transact({'value': 76569678407350600, 'from': accounts[3]}).buyTokens(accounts[3])
    chain.wait.for_receipt(cs_tx)

    total = token.call().totalSupply()

    assert total == 15007

    crowdsale.transact().finalizeCrowdsale(accounts[8])

    cap = token.call().cap()

    assert cap == 42854

    assert token.call().totalSupply() == 21427
    assert token.call().cap() == 42854

    # token.transact().finishMinting()
    try:
        crowdsale.transact().finalizeCrowdsale(accounts[6])
        assert False
    except TransactionFailed:
        pass

    assert token.call().totalSupply() == 21427
    assert token.call().cap() == 42854


def off_test_phases(web3, accounts, chain):
    token, _ = chain.provider.get_or_deploy_contract('LongevityToken')

    deploy_args = (
        token.address,
        130671
    )
    crowdsale, _ = chain.provider.get_or_deploy_contract('LongevityCrowdsale', deploy_args=deploy_args)

    # 1522151323 03/27/2018
    # add phase
    crowdsale.transact().setTotalPhases(3)
    crowdsale.transact().setPhase(0, 0, 1519862400, 50)
    crowdsale.transact().setPhase(1, 1519862401, 1522540800, 40)
    crowdsale.transact().setPhase(2, 1522540801, 1525132800, 30)

    try:
        crowdsale.call().getBonusPercent(2525132800)
        assert False
    except Exception:
        pass

    b = crowdsale.call().getPhase(0)
    print(b)
    assert False

    # this tests not working under current version of Populus
    # assert crowdsale.call().getBonusPercent(10) == 50
    # assert crowdsale.call().getBonusPercent(1519862500) == 40
    # assert crowdsale.call().getBonusPercent(1522540900) == 30


def test_wallets(web3, accounts, chain):
    token, _ = chain.provider.get_or_deploy_contract('LongevityToken')

    deploy_args = (
        token.address,
        130671
    )
    crowdsale, _ = chain.provider.get_or_deploy_contract('LongevityCrowdsale', deploy_args=deploy_args)

    assert crowdsale.call().wallets(0) == accounts[0]

    try:
        crowdsale.transact({'from': accounts[9]}).addWallet(accounts[1])
        assert False
    except TransactionFailed:
        pass

    crowdsale.transact({'from': accounts[0]}).addWallet(accounts[1])
    assert crowdsale.call().getWalletsCount() == 2
    crowdsale.transact().addWallet(accounts[3])
    assert crowdsale.call().wallets(2) == accounts[3]
    crowdsale.transact().delWallet(2)
    assert crowdsale.call().getWalletsCount() == 2
    try:
        crowdsale.transact({'from': accounts[3]}).delWallet(2)
        assert False
    except Exception:
        pass

    crowdsale.transact().delWallet(0)
    assert crowdsale.call().getWalletsCount() == 1
    assert crowdsale.call().wallets(0) == accounts[1]
