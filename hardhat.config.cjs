

/** @type import('hardhat/config').HardhatUserConfig */
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: '0.8.26',
  networks: {
    sepolia: {
      url: `${process.env.SEPOLIA_RPC}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    cardona: {
      url: `${process.env.POLYGON_ZKEVM_CARDONA_RPC}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    astarZkyoto: {
      url:  `${process.env.ASTAR_ZKYOTO}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
