
import expectThrow from '../test/helpers/expectThrow';
import ether from '../test/helpers/ether';

var CappedToken = artifacts.require('../mocks/LongevityTokenMock.sol');

contract('Capped', function (accounts) {
  const cap = new web3.BigNumber(2000);

  let token;

  beforeEach(async function () {
    token = await CappedToken.new(accounts[0], 1000);
    await token.addMinter(accounts[0]);
    await token.setMintTap(99999999999999999999);
    await token.setCap()
  });

  it('should start with the correct cap', async function () {
    let _cap = await token.cap();

    assert(cap.eq(_cap));
  });

  it('should mint when amount is less than cap', async function () {
    const result = await token.mint(accounts[0], 999);
    assert.equal(result.logs[0].event, 'Mint');
  });

  it('should fail to mint if the ammount exceeds the cap', async function () {
    await expectThrow(token.mint(accounts[0], 1001));
  });

  it('should fail to mint after cap is reached', async function () {
    await token.mint(accounts[0], 1000);
    await expectThrow(token.mint(accounts[0], 1));
  });
});
