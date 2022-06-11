require("@nomiclabs/hardhat-waffle");
require("./tasks/flatter");
require("./tasks/delay");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    elastosmainnet: {
      url: "https://api.elastos.io/esc",
      accounts: [],
    },
    elastostestnet: {
      url: "https://api-testnet.elastos.io/eth",
      accounts: [],
    },
  },
  contractAddress: '',
  platformAddress: '',
  platformFeeRate: 5,
  testAddress1: '',
  testAddress2: '',
  testAddress3: '',
};
