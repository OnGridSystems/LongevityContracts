pragma solidity ^0.4.18;

contract PriceOracleMock {
    uint256 public priceUSDcETH;
    function PriceOracleMock() public {
        priceUSDcETH = 130600;
    }
}