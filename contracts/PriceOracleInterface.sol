pragma solidity ^0.4.18;


/**
 * @title PriceOracle interface
 * @dev Price oracle is a contract representing actual average ETH/USD price in the
 * Ethereum blockchain fo use by other contracts.
 */
contract PriceOracleIface {
    // USD cents per ETH exchange price
    uint256 public priceUSDcETH;
}