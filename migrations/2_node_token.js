var LongevityToken = artifacts.require("LongevityToken");
var LongevityCrowdsale = artifacts.require("LongevityCrowdsale");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(LongevityToken);
  LongevityToken.deployed().then(function (nToken) {
      console.log("##########" + nToken.address);
      nToken.setMintTap(99999999999999999999);
      deployer.deploy(LongevityCrowdsale, nToken.address, 130671).then(function(){
      LongevityCrowdsale.deployed().then(function (nCS) {
        console.log("##########" + nCS.address);
        nToken.addMinter(nCS.address);
      })
    })
    })
};
