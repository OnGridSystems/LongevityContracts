pragma solidity ^0.4.18;


import "./token/StandardToken.sol";


contract LongevityToken is StandardToken {
    string public name = "Longevity";
    string public symbol = "LTY";
    uint8 public decimals = 2;
    uint256 public cap = 2**256 - 1; // maximum possible uint256. Decreased on finalization
    bool public mintingFinished = false;
    mapping (address => bool) owners;
    mapping (address => bool) minters;
    // tap to limit mint speed
    struct Tap {
        uint256 startTime; // reference time point to start measuring
        uint256 tokensIssued; // how much tokens issued from startTime
        uint256 mintSpeed; // token fractions per second
    }
    Tap public mintTap;
    bool public capFinalized = false;

    event Mint(address indexed to, uint256 amount);
    event MintFinished();
    event OwnerAdded(address indexed newOwner);
    event OwnerRemoved(address indexed removedOwner);
    event MinterAdded(address indexed newMinter);
    event MinterRemoved(address indexed removedMinter);
    event Burn(address indexed burner, uint256 value);
    event MintTapSet(uint256 startTime, uint256 mintSpeed);
    event SetCap(uint256 currectTotalSupply, uint256 cap);

    function LongevityToken() public {
        owners[msg.sender] = true;
    }

    /**
     * @dev Function to mint tokens
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address _to, uint256 _amount) onlyMinter public returns (bool) {
        require(!mintingFinished);
        require(totalSupply.add(_amount) <= cap);
        passThroughTap(_amount);
        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        Mint(_to, _amount);
        Transfer(address(0), _to, _amount);
        return true;
    }

    /**
     * @dev Function to stop minting new tokens.
     * @return True if the operation was successful.
     */
    function finishMinting() onlyOwner public returns (bool) {
        require(!mintingFinished);
        mintingFinished = true;
        MintFinished();
        return true;
    }

    /**
     * @dev Burns a specific amount of tokens.
     * @param _value The amount of token to be burned.
     */
    function burn(uint256 _value) public {
        require(_value <= balances[msg.sender]);
        // no need to require value <= totalSupply, since that would imply the
        // sender's balance is greater than the totalSupply, which *should* be an assertion failure

        address burner = msg.sender;
        balances[burner] = balances[burner].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(burner, _value);
    }

    /**
     * @dev Adds administrative role to address
     * @param _address The address that will get administrative privileges
     */
    function addOwner(address _address) onlyOwner public {
        owners[_address] = true;
        OwnerAdded(_address);
    }

    /**
     * @dev Removes administrative role from address
     * @param _address The address to remove administrative privileges from
     */
    function delOwner(address _address) onlyOwner public {
        owners[_address] = false;
        OwnerRemoved(_address);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owners[msg.sender]);
        _;
    }

    /**
     * @dev Adds minter role to address (able to create new tokens)
     * @param _address The address that will get minter privileges
     */
    function addMinter(address _address) onlyOwner public {
        minters[_address] = true;
        MinterAdded(_address);
    }

    /**
     * @dev Removes minter role from address
     * @param _address The address to remove minter privileges
     */
    function delMinter(address _address) onlyOwner public {
        minters[_address] = false;
        MinterRemoved(_address);
    }

    /**
     * @dev Throws if called by any account other than the minter.
     */
    modifier onlyMinter() {
        require(minters[msg.sender]);
        _;
    }

    /**
     * @dev passThroughTap allows minting tokens within the defined speed limit.
     * Throws if requested more than allowed.
     */
    function passThroughTap(uint256 _tokensRequested) internal {
        require(_tokensRequested <= getTapRemaining());
        mintTap.tokensIssued = mintTap.tokensIssued.add(_tokensRequested);
    }

    /**
     * @dev Returns remaining amount of tokens allowed at the moment
     */
    function getTapRemaining() public view returns (uint256) {
        uint256 tapTime = now.sub(mintTap.startTime).add(1);
        uint256 totalTokensAllowed = tapTime.mul(mintTap.mintSpeed);
        uint256 tokensRemaining = totalTokensAllowed.sub(mintTap.tokensIssued);
        return tokensRemaining;
    }

    /**
     * @dev (Re)sets mint tap parameters
     * @param _mintSpeed Allowed token amount to mint per second
     */
    function setMintTap(uint256 _mintSpeed) onlyOwner public {
        mintTap.startTime = now;
        mintTap.tokensIssued = 0;
        mintTap.mintSpeed = _mintSpeed;
        MintTapSet(mintTap.startTime, mintTap.mintSpeed);
    }

    /**
     * @dev sets token Cap (maximum possible totalSupply) on Crowdsale finalization
     * Cap will be set to (sold tokens + team tokens) * 2
     */
    function setCap() onlyOwner public {
        require(!capFinalized);
        require(cap == 2**256 - 1);
        cap = totalSupply.mul(2);
        capFinalized = true;
        SetCap(totalSupply, cap);
    }
}
