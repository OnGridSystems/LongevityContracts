pragma solidity ^0.4.18; // solhint-disable-line compiler-fixed

import "./math/SafeMath.sol";
import "./LongevityToken.sol";
import "./PriceOracleInterface.sol";


/**
 * @title LongevityCrowdsale
 * @dev LongevityCrowdsale is a contract for managing a token crowdsale for Longevity project.
 * Crowdsale have phases with start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate and discounts. Collected funds are forwarded to the wallets
 * as they arrive.
 */
contract LongevityCrowdsale {
    using SafeMath for uint256;

    // The token being sold
    LongevityToken public token;

    // Crowdsale administrators
    mapping(address => bool) public owners;

    // Cashiers responsible for manual token issuance
    mapping(address => bool) public cashiers;

    // ETH/USD on-chain price source
    PriceOracleIface public oracle;

    struct Phase {
        uint256 startDate;
        uint256 endDate;
        uint256 discountPercent;
    }

    Phase[] public phases;

    // Minimum Deposit in USD cents
    uint256 public minContributionUSDc = 1000;

    bool public finalized = false;

    // Amount of raised Ethers (in wei).
    uint256 public weiRaised;

    // Amount of raised Dollars in cents
    uint256 public USDcRaised;

    // Wallets array
    address[] public wallets;

    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param discountPercent free tokens percantage for the phase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value,
        uint256 discountPercent, uint256 amount);

    event OffChainTokenPurchase(address indexed beneficiary, uint256 tokensSold, uint256 USDcAmount);

    // event for wallet update
    event WalletAdded(address indexed wallet);
    event WalletRemoved(address indexed wallet);

    // owners management events
    event OwnerAdded(address indexed newOwner);
    event OwnerRemoved(address indexed removedOwner);

    // cashier management events
    event CashierAdded(address indexed newBot);
    event CashierRemoved(address indexed removedBot);

    // phase editor events
    event PhaseAdded(address indexed sender, uint256 index, uint256 startDate,
        uint256 endDate, uint256 discountPercent);

    event PhaseDeleted(address indexed sender, uint256 index);

    // Oracle change event
    event OracleChanged(address newOracle);

    function LongevityCrowdsale(LongevityToken _token, PriceOracleIface _oracle) public {
        require(_token != address(0));
        require(_oracle != address(0));
        token = _token;
        oracle = _oracle;
        owners[msg.sender] = true;
        addWallet(msg.sender);
    }

    // fallback function can be used to buy tokens
    function() external payable {
        buyTokens(msg.sender);
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != address(0));
        require(msg.value != 0);
        uint256 weiAmount = msg.value;
        uint256 currentDiscountPercent = getCurrentDiscountPercent();
        require(calculateUSDcValue(weiAmount) >= minContributionUSDc);
        // calculate token amount to be created
        uint256 tokens = calculateTokenAmount(weiAmount, currentDiscountPercent);

        weiRaised = weiRaised.add(weiAmount);
        USDcRaised = USDcRaised.add(calculateUSDcValue(weiRaised));
        token.mint(beneficiary, tokens);
        emit TokenPurchase(msg.sender, beneficiary, weiAmount, currentDiscountPercent, tokens);
        forwardFunds();
    }

    // Sell any amount of tokens for cash or CryptoCurrency
    function offChainPurchase(address beneficiary, uint256 tokensSold, uint256 USDcAmount) public onlyCashier {
        require(beneficiary != address(0));
        USDcRaised = USDcRaised.add(USDcAmount);
        token.mint(beneficiary, tokensSold);
        emit OffChainTokenPurchase(beneficiary, tokensSold, USDcAmount);
    }

    /**
     * @dev Proxies current ETH balance request to the Oracle contract
     * @return ETH price in USD cents
     */
    function getPriceUSDcETH() public view returns (uint256) {
        require(oracle.priceUSDcETH() > 0);
        return oracle.priceUSDcETH();
    }

    /**
     * @dev Allows to change Oracle address (source of ETH price)
     * @param _oracle ETH price oracle where we get actual exchange rate
     */
    function setOracle(PriceOracleIface _oracle) public onlyOwner {
        require(oracle.priceUSDcETH() > 0);
        oracle = _oracle;
        emit OracleChanged(oracle);
    }

    /**
     * @dev Adds administrative role to address
     * @param _address The address that will get administrative privileges
     */
    function addOwner(address _address) public onlyOwner {
        owners[_address] = true;
        emit OwnerAdded(_address);
    }

    /**
     * @dev Removes administrative role from address
     * @param _address The address to remove administrative privileges from
     */
    function delOwner(address _address) public onlyOwner {
        owners[_address] = false;
        emit OwnerRemoved(_address);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owners[msg.sender]);
        _;
    }

    /**
     * @dev Adds cashier account responsible for manual token issuance
     * @param _address The address of the Cashier
     */
    function addCashier(address _address) public onlyOwner {
        cashiers[_address] = true;
        emit CashierAdded(_address);
    }

    /**
     * @dev Removes cashier account responsible for manual token issuance
     * @param _address The address of the Cashier
     */
    function delCashier(address _address) public onlyOwner {
        cashiers[_address] = false;
        emit CashierRemoved(_address);
    }

    /**
     * @dev Throws if called by any account other than Cashier.
     */
    modifier onlyCashier() {
        require(cashiers[msg.sender]);
        _;
    }

    // calculate deposit value in USD Cents
    function calculateUSDcValue(uint256 weiAmount) public view returns (uint256) {
        uint256 priceUSDcETH = getPriceUSDcETH();
        uint256 valueUSDc = weiAmount.mul(priceUSDcETH).div(1 ether);
        return valueUSDc;
    }

    // calculates how much tokens will beneficiary get
    // for given amount of wei
    function calculateTokenAmount(uint256 weiReceived, uint256 discountPercent) public view returns (uint256) {
        uint256 USDcReceived = calculateUSDcValue(weiReceived);
        uint256 tokensPerUSDc = 100;
        // tokens per USD cent without discount
        uint256 pricePercent = SafeMath.sub(100, discountPercent);
        return USDcReceived.mul(tokensPerUSDc).mul(100).div(pricePercent);
    }

    /**
     * @dev Checks if dates overlap with existing phases of the contract.
     * @param _startDate  Start date of the phase
     * @param _endDate    End date of the phase
     * @return true if provided dates valid
     */
    function validatePhaseDates(uint256 _startDate, uint256 _endDate) public view returns (bool) {
        if (_endDate <= _startDate) {
            return false;
        }
        for (uint i = 0; i < phases.length; i++) {
            if (_startDate >= phases[i].startDate && _startDate <= phases[i].endDate) {
                return false;
            }
            if (_endDate >= phases[i].startDate && _endDate <= phases[i].endDate) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Adds a new phase
     * @param _startDate  Start date of the phase
     * @param _endDate    End date of the phase
     * @param _discountPercent  Price USD cents per token
     */
    function addPhase(uint256 _startDate, uint256 _endDate, uint256 _discountPercent) public onlyOwner {
        require(validatePhaseDates(_startDate, _endDate));
        phases.push(Phase(_startDate, _endDate, _discountPercent));
        uint256 index = phases.length - 1;
        emit PhaseAdded(msg.sender, index, _startDate, _endDate, _discountPercent);
    }

    /**
     * @dev Delete phase by its index
     * @param index Index of the phase
     */
    function delPhase(uint256 index) public onlyOwner {
        require (index < phases.length);
        for (uint256 i = index; i < phases.length - 1; i++) {
            phases[i] = phases[i + 1];
        }
        phases.length--;
        emit PhaseDeleted(msg.sender, index);
    }

    /**
     * @dev Return current phase index
     * @return current phase id
     */
    function getPhaseIndex(uint256 unixtime) public view returns (uint256) {
        for (uint i = 0; i < phases.length; i++) {
            if (phases[i].startDate <= unixtime && unixtime <= phases[i].endDate) {
                return i;
            }
        }
        revert();
    }

    function getCurrentPhaseIndex() public view returns (uint256) {
        return getPhaseIndex(now);
    }

    //tested
    function getDiscountPercent(uint256 unixtime) public view returns (uint256) {
        return phases[getPhaseIndex(unixtime)].discountPercent;
    }

    function getCurrentDiscountPercent() public view returns (uint256) {
        return phases[getCurrentPhaseIndex()].discountPercent;
    }

    // Add wallet address to wallets list
    function addWallet(address _address) public onlyOwner {
        require(_address != address(0));
        for (uint256 i = 0; i < wallets.length; i++) {
            require(_address != wallets[i]);
        }
        wallets.push(_address);
        emit WalletAdded(_address);
    }

    // Delete wallet from wallets list
    function delWallet(uint256 index) public onlyOwner {
        require (index < wallets.length);
        address walletToRemove = wallets[index];
        for (uint256 i = index; i < wallets.length - 1; i++) {
            wallets[i] = wallets[i + 1];
        }
        wallets.length--;
        emit WalletRemoved(walletToRemove);
    }

    // finalizeCrowdsale issues tokens for the Team.
    // Team gets 30/70 of harvested funds then token gets capped (upper emission boundary locked) to totalSupply * 2
    // The token split after finalization will be in % of total token cap:
    // 1. Tokens issued and distributed during pre-ICO and ICO = 35%
    // 2. Tokens issued for the team on ICO finalization = 30%
    // 3. Tokens for future in-app emission = 35%
    function finalizeCrowdsale(address _teamAccount) public onlyOwner {
        require(!finalized);
        uint256 soldTokens = token.totalSupply();
        uint256 teamTokens = soldTokens.mul(30).div(70);
        token.mint(_teamAccount, teamTokens);
        token.setCap();
        finalized = true;
    }

    // send ether to the fund collection wallet
    function forwardFunds() internal {
        uint256 value = msg.value / wallets.length;
        uint256 rest = msg.value - (value * wallets.length);
        for (uint i = 0; i < wallets.length - 1; i++) {
            wallets[i].transfer(value);
        }
        wallets[wallets.length - 1].transfer(value + rest);
    }
}
