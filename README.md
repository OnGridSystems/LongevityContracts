# Longevity contracts
Longevity Ethereum contracts stack consists of
* Longevity token (LTY) - the coin supposed to be the main digital asset in Eterly application;
* Crowdsale contract - preallocates LTYs to investors during pre-ICO and ICO token sale then finalizes token 
parameters.

## Token contract
LTY is [ERC-20](https://github.com/ethereum/EIPs/issues/20) standard token with the following paramaters:

- Name: **Longevity**
- Symbol: **LTY**
- Decimals: **2**
- Mintable: **Yes**, Special role for minting, Tapped (limited speed), Finalizeable
- Burnable: **Yes**, owner can burn his tokens 
- Capped: **Yes**, Cap determined **after** ICO as totalSupply * 2 
- RBAC: **Yes**, Minters (mint), Owners (set tap, add minters, finish minting)
- Source Code: **[LongevityToken.sol](contracts/LongevityToken.sol)**
- Mainnet address: **[0x7D92E5d02eFe657FACA3e67E07E1fcb10d783C9E](https://etherscan.io/address/0x7d92e5d02efe657faca3e67e07e1fcb10d783c9e)**

## Crowdsale contract

- Source code: **[LongevityCrowdsale.sol](contracts/LongevityCrowdsale.sol)**
- Mainnet address: **[0xeC807912F908e4CD044e147DaC2a1AEdEDeA6900](https://etherscan.io/address/0xec807912f908e4cd044e147dac2a1aededea6900)**

Contract for managing a token crowdsale for Longevity project. It receives ether and sends back corresponding amount of LTY tokens. 
Base token price is 100.00 LTY per US Dollar. ICO participant gets additional discount depending on the current phase (see the schedule).
The crowdsale contract contains a list of phase, each phase has a start time, end time and discount. The first matching phase 
discount applied, please avoid overlaps. If corrent time matches no phase the operation is thrown (reverted).
OffChainPurchases totally ignore phases and rely on backend logic. Please keep on-chain and backend phases is sync.

### Crowdsale schedule

| Phase | Ph.Name  | Start date (UTC)    | Start Unix | End date (UTC)      | End Unix   | Discount |
| ----- | -------- | ------------------- | ---------- | ------------------- | ---------- | -------- |
| 0     | preSale0 | 2018-03-28 00:00:00 | 1522195200 | 2018-04-14 23:59:59 | 1523750399 | 40%      |
| 1     | preSale1 | 2018-04-15 00:00:00 | 1523750400 | 2018-04-30 23:59:59 | 1525132799 | 30%      |
| 2     | preSale2 | 2018-05-01 00:00:00 | 1525132800 | 2018-05-31 23:59:59 | 1527811199 | 25%      |
| 3     | preSale3 | 2018-06-01 00:00:00 | 1527811200 | 2018-06-20 23:59:59 | 1529539199 | 20%      |
| pause | pause    | -                   | -          | -                   | -          | -        |
| 4     | mainSale | 2018-07-01 00:00:00 | 1530403200 | 2018-07-31 23:59:59 | 1533081599 | 0%       |

### Crowdsale schedule modification

The internal phases schedule can be manipulated at any time by the owner with following methods:
```
setTotalPhases(uint value)
setPhase(uint index, uint256 _startTime, uint256 _endTime, uint256 _discountPercent)
delPhase(uint index)
```
### Price oracle

In-contract ETH price is kept up to date by external entity Oracle polling the exchanges. Oracle runs as an external off-chain script
under the low-privileged 'Bot' account. A list of such oracle bots can be changed by the owner with the methods:
```
addBot(address _address)
delBot(address _address)
```

### Wallets

All the funds received from the investors are evenly split and forwarded to securely stored wallets (Externally Owned Accounts) 
to avoid any on-chain risks. Wallets can be added or removed at any point of time by the owners. 
```
TBD
```

# Get the source code
Clone the contracts repository with submodules (we use zeppelin-solidity libraries)
```
git clone --recurse-submodules git@github.com:OnGridSystems/LongevityContracts.git
```

# Test it
To be sure in code quality and compatibility we use BOTH framoworks for testing our code:
* truffle - popular JS-based DApps framework. Uses solc-js compiler and mocha;
* populus - python-based ethereum framework. Uses solc compiler and pytest.

## Run truffle tests
- Install [truffle framework](http://truffleframework.com) on your host. It will install solc-js compiler automatically.
- Run ```truffle develop``` in one console, its command prompt > will appear. Leave it open.
- Start the new console and type ```truffle deploy --reset```.
- After migration run ```truffle test --reset``` and see the progress.

## Run populus tests
- Install latest python3 (in this example we use python3.6).
- Create python virtual environment, activate and install requirements
```
virtualenv --python=python3.6 .
source bin/activate
pip install -r requirements.txt
```
- There is annoying solc option 'allow_paths' denying access to project sources. Patch solc wrapper to mute it.
```
read -d "" PATCH <<"EOF"
49c49
<                  allow_paths=None,
---
>                  allow_paths="/",
EOF
echo "$PATCH" | patch lib/python3.6/site-packages/solc/wrapper.py
```
- run tests and enjoy
```
py.test test/
```
# Deploy on the net

- Flatten your solidity code
The simplest way to move your code to the IDE and other tools is to make it flat (opposed to hierarchically organized files)
Install truffle-flattener via npm
```npm install -g truffle-flattener```
and flatten your crowdsale contract to a single code snippet, copy it
```truffle-flattener contracts/LongevityCrowdsale.sol```
You can use [Remix IDE](http://remix.ethereum.org) for deployment on the net. 

- Deploy **Token** contract, you should get an address of deployed contract (*Token*)
```
deploy(Token)
```
- As Tx get mined go to the etherscan and do **Token**'s source code verification
- Set mint tap to reasonable initial amount of tokens per second
```
Token.setMintTap(10000) //100 tokens/s
```
- Deploy **Crowdsale** contract, use the **Token** address and current ETH price in USD cents as arguments
```
deploy(Crowdsale, Token.address, 12345)
```
- By default Crowdsale contract has a single wallet receiving collected ethers - the address who deployed the contract.
You can add/delete receiving wallets manually.
```
Crowdsale.getWalletsCount()
Crowdsale.wallets(0)
Crowdsale.addWallet(walletAddress)
Crowdsale.wallets(1)
Crowdsale.delWallet(0)
```
- Add Oracle bot account to do regular price updates
```
Crowdsale.addBot(botAddress)
```
- Add Cashier account for non-Ethereum payments
```
Crowdsale.addCashier(cashierAddress)
```
- Add Phases
```
Crowdsale.setTotalPhases(5)
// Args are: index, startDate, stopDate, discount%
Crowdsale.setPhase(0, 1522195200, 1523750399, 40)
Crowdsale.setPhase(1, 1523750400, 1525132799, 30)
Crowdsale.setPhase(2, 1525132800, 1527811199, 25)
Crowdsale.setPhase(3, 1527811200, 1529539199, 20)
Crowdsale.setPhase(4, 1530403200, 1533081599, 0)
```
- Add Crowdsale contract to the minters list of the token
```
Token.addMinter(Crowdsale.address)
```
# Post-Deploy steps
- Good practice is to verify Source Code on the etherscan. Do it for both Crowdsale and Token.
- Publish your Crowdsale contract for investors. Make a notice on dates, discounts and minimal contributon.

# Crowdsale housekeeping
- keep contract ETH price up do date (the external Oracle script does it perfectly!). Only account in bots list allowed to do this.
```
Crowdsale.setRate(12345) // ETH price in USD cents
```
- receive non-Ethereum deposits and mint corresponding amount of tokens. Only cashier account.
```
// receive 100 USD and issue 14000.00 tokens
Crowdsale.offChainPurchase(beneficiaryAccount, 1400000, 10000) 
```
# Finalize crowdsale
After the last phase ends 30/70 of issued tokens minted for the team DAO contract. 
Then token gets finally capped to totalSupply * 2.
The entire procedure is triggered by the owner with this call:
```
Crowdsale.finalizeCrowdsale(teamAccount)
```
Then disconnect Crowdsale from the token (remove minting privileges given before).
```
Token.delMinter(Crowdsale.address)
```

# Post-finalization state
* the token is still mintable. To continue minting you should add new minter for the process and set appropriate minting speed limit - tap).
* minting is limited by the cap. After finalization cap is unchanged.

