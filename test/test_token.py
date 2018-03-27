from ethereum.tester import TransactionFailed


def test_token_deployment(web3, accounts, chain):
    token, _ = chain.provider.get_or_deploy_contract('LongevityToken')

    deploy_args = (
        token.address,
        130671
    )
    crowdsale, _ = chain.provider.get_or_deploy_contract('LongevityCrowdsale', deploy_args=deploy_args)

    tx = token.transact().addMinter(crowdsale.address)
    chain.wait.for_receipt(tx)
    filter = token.pastEvents("MinterAdded")
    logs = filter.get()
    assert logs[0]['event'] == "MinterAdded"

    token.transact().addMinter(accounts[5])

    tx = token.transact().delMinter(accounts[5])
    chain.wait.for_receipt(tx)
    filter = token.pastEvents("MinterRemoved")
    logs = filter.get()
    assert logs[0]['event'] == "MinterRemoved"


def test_minting(web3, accounts, chain):
    token, _ = chain.provider.get_or_deploy_contract('LongevityToken')

    deploy_args = (
        token.address,
        130671
    )
    crowdsale, _ = chain.provider.get_or_deploy_contract('LongevityCrowdsale', deploy_args=deploy_args)

    try:
        token.transact().mint(accounts[0], 10000)
        assert False
    except Exception:
        pass
    try:
        token.transact().mint(accounts[1], 10000)
        assert False
    except Exception:
        pass

    token.transact().addMinter(accounts[0])

    tap = token.call().mintTap()
    assert tap[0] == 0 and tap[1] == 0 and tap[2] == 0

    assert token.call().getTapRemaining() == 0

    try:
        token.transact({'from': accounts[5]}).setMintTap(1000000)
        assert False
    except Exception:
        pass

    tx = token.transact().setMintTap(1000000)
    chain.wait.for_receipt(tx)
    filter = token.pastEvents("MintTapSet")
    logs = filter.get()
    assert logs[0]['event'] == "MintTapSet"

    token.transact().mint(accounts[0], 1000)
