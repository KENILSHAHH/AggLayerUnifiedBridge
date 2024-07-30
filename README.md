# Unified Bridge

This is simple tutorial to explain the lifecycle of bridging assets to and fro from chains connected AggLayer using [Unified Bridge Contract](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMBridgeV2.sol)

To get started with the project, clone the project 

```git clone https://github.com/KENILSHAHH/AggLayerUnifiedBridge ```

Go to the root directory

```cd AggLayerUnifiedBridge```

Create a .env file in the root directory and copy paste the content of *.env.example* file into your .env file. 

Enter your wallet's private key. Its recommended to use rpc endpoints from Alchemy or Infura

Once done, install the dependencies using yarn

```yarn install```

The `bridgeETH.js` file shows an example of bridging 0.01 ETH from Polygon zkEVM Cardona testnet to Sepolia testnet. To bridge a native token, the ETH token contract address is nothing but a Zero Address (0x0000000000000000000000000000000000000000) .To bridge a custom ERC20 between AggLayer Chains, just change the token contract address in `constants.js` file 
** Note : If you are bridging custom ERC20 token, you need to approve contract to spend the amount of tokens on your behalf **

 
