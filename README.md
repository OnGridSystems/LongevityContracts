# Longevity contracts
Longevity ethereum ecosystem consists of
* Main token - Ethereum-based ERC-20 compatible digital asset
* Crowdsale contract for pre-ICO and ICO rounds

## Token contract
[LongevityToken.sol](contracts/LongevityToken.sol)

## Crowdsale contract
[LongevityCrowdsale.sol](contracts/LongevityCrowdsale.sol) - phased Crowdsale


| Ph.ID | Ph.Name  | Start date (UTC)    | Start Unix | End date (UTC)      | End Unix   | Discount |
| ----- | -------- | ------------------- | ---------- | ------------------- | ---------- | -------- |
| 0     | preSale0 | 2018-03-28 00:00:00 | 1522195200 | 2018-04-14 23:59:59 | 1523750399 | 40%      |
| 1     | preSale1 | 2018-04-15 00:00:00 | 1523750400 | 2018-04-30 23:59:59 | 1525132799 | 30%      |
| 2     | preSale2 | 2018-05-01 00:00:00 | 1525132800 | 2018-05-31 23:59:59 | 1527811199 | 25%      |
| 3     | preSale3 | 2018-06-01 00:00:00 | 1527811200 | 2018-06-20 23:59:59 | 1529539199 | 20%      |
| pause | pause    | -                   | -          | -                   | -          | -        |
| 4     | mainSale | 2018-07-01 00:00:00 | 1530403200 | 2018-07-31 23:59:59 | 1533081599 | 0%       |


# Testing
Install [truffle framework](http://truffleframework.com) 

Run ```truffle develop``` in one console, truffle command prompt will appear. Leave it open.
Run new console and type ```truffle deploy --reset``` then ```truffle test --reset``` and see the progress.

# Deploy on the live network

## Flatten your solidity code
Install truffle-flattener via npm
```npm install -g truffle-flattener```
then flatten your crowdsale contract to a single code snippet and copy it
```truffle-flattener contracts/LongevityCrowdsale.sol```

## Paste it into the Remix IDE
Open [Remix IDE](http://remix.ethereum.org) and connect it with the Ethereum Network via Metamask injected web3 or remote
node web3 interface (geth/parity) via *Run - Environment* menu.

## Deploy Token
On *Run* tab select **LongevityToken** from dropdown menu and push **Create** button. New transaction will appear and you'll 
get the LongevityToken object in the right panel with blue and rose buttons.

TBD
