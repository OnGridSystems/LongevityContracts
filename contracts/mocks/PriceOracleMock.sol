pragma solidity ^0.4.18;

contract PriceOracleMock {
    uint256 public priceUSDcETH;

    function PriceOracleMock(uint256 _price) public {
        priceUSDcETH = _price;
    }
}