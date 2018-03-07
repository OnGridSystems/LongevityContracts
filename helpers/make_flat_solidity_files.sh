#!/bin/bash
cd helpers
cd oracles-combine-solidity
npm install
npm start "../../contracts/LongevityToken.sol"
mv ./out/*.sol ../../
rm -f ./out/*.sol
