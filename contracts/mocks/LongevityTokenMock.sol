pragma solidity ^0.4.18;


import '../LongevityToken.sol';


// mock class using BasicToken
contract LongevityTokenMock is LongevityToken {

  function LongevityTokenMock(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
    owners[msg.sender] = true;
  }

}
