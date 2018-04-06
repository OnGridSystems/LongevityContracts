var LongevityToken = artifacts.require("LongevityToken");
var LongevityCrowdsale = artifacts.require("LongevityCrowdsale");
var PriceOracleMock = artifacts.require("PriceOracleMock");

module.exports = function (deployer) {
    // deployment steps
    deployer.deploy(PriceOracleMock);
    deployer.deploy(LongevityToken);
    LongevityToken.deployed().then(function (nToken) {
        console.log("##########" + nToken.address);
        nToken.setMintTap(99999999999999999999);
        deployer.deploy(LongevityCrowdsale, nToken.address, PriceOracleMock.address).then(function () {
            LongevityCrowdsale.deployed().then(function (nCS) {
                console.log("##########" + nCS.address);
                nToken.addMinter(nCS.address);
            })
        })
    })
};
