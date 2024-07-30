/** @format */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import UnifiedBridge from './abi/UnifiedBridge.js';
import constants from './constants.json' assert { type: 'json' };

const _GLOBAL_INDEX_MAINNET_FLAG = BigInt(2 ** 64);
async function bridgeAsset() {
  dotenv.config();
  const networkArray = [
    constants.SEPOLIA_RPC,
    constants.POLYGON_ZKEVM_CARDONA_RPC,
    constants.ASTAR_ZKYOTO_RPC,
  ];

  // function computeGlobalIndex(indexLocal, sourceNetworkId) {
  //   if (BigInt(sourceNetworkId) === BigInt(0)) {
  //     return BigInt(indexLocal) + _GLOBAL_INDEX_MAINNET_FLAG;
  //   } else {
  //     return BigInt(indexLocal) + BigInt(sourceNetworkId - 1) * BigInt(2 ** 32);
  //   }
  // }
  const privateKey = process.env.PRIVATE_KEY;
  const unifiedBridgeContractAddress =
    '0x528e26b25a34a4a5d0dbda1d57d318153d2ed582';
  const sourceNetwork = networkArray[1];
  const destinationNetwork = 0; //    [sepolia, zkEVMCardona, astarZkyoto]
  const destinationAddress = constants.destinationAddress;
  const tokenAddress = constants.tokenContractAddress;
  const tokenAmount = 1000000000000000000n;
  const forceUpdateGlobalExitRoot = true; //do not change this
  const sourceProvider = new ethers.providers.JsonRpcProvider(
    `${sourceNetwork}`
  );
  const permitData = '0x';
  const wallet = new ethers.Wallet(privateKey, sourceProvider);

  const contract = new ethers.Contract(
    unifiedBridgeContractAddress,
    UnifiedBridge,
    wallet
  );
  let leafType;
  let originNetwork;
  let amount;
  let originAddress;
  let depositCount;
  let metadata;
  let merkleProof;

  contract.on(
    'BridgeEvent',
    (
      _leafType,
      _originNetwork,
      _originAddress,
      _destinationNetwork,
      _destinationAddress,
      _amount,
      _metadata,
      _depositCount
    ) => {
      leafType = _leafType;
      originNetwork = _originNetwork;
      amount = _amount;
      originAddress = _originAddress;
      depositCount = _depositCount;
      metadata = _metadata;
      console.log(destinationNetwork, originAddress, depositCount);
    }
  );

  const txn = await contract.bridgeAsset(
    destinationNetwork,
    destinationAddress,
    tokenAmount,
    tokenAddress,
    forceUpdateGlobalExitRoot,
    permitData
  );

  await txn.wait(2);
  const txnHash = txn.hash;
  console.log(txnHash);

  setTimeout(async () => {
    const api = `https://api-gateway.polygon.technology/api/v3/merkle-proof/testnet?networkId=1&depositCount=${depositCount}`;
    try {
      const apiRes = await fetch(api);

      if (apiRes.ok) {
        const apiResBlob = await apiRes.blob();
        const apiResText = await apiResBlob.text();
        const apiResJson = JSON.parse(apiResText);
        merkleProof = apiResJson.proof;
      } else {
        console.error('HTTP error', apiRes.status, apiRes.statusText);
      }
    } catch (error) {
      console.error('Fetch error', error);
    }
    const payLoadData = {
      smtProof: merkleProof.merkle_proof,
      smtProofRollup: merkleProof.rollup_merkle_proof,
      globalIndex: depositCount.toString(),
      mainnetExitRoot: merkleProof.main_exit_root,
      rollupExitRoot: merkleProof.rollup_exit_root,
      originNetwork: originNetwork,
      originAddress: originAddress,
      destinationNetwork: destinationNetwork,
      destinationAddress: destinationAddress,
      amount: amount,
      metadata: metadata,
    };
    console.log(payLoadData);

    const destinationProvider = new ethers.providers.JsonRpcProvider(
      `${networkArray[0]}`
    );
    const destinationWallet = new ethers.Wallet(
      privateKey,
      destinationProvider
    );
    const destinationContract = new ethers.Contract(
      unifiedBridgeContractAddress,
      UnifiedBridge,
      destinationWallet
    );
    const isClaimed = await destinationContract.isClaimed(depositCount, 1);
    console.log(isClaimed);
    if (isClaimed == false) {
      const claimTxn = await destinationContract.claimAsset(
        payLoadData.smtProof,
        payLoadData.smtProofRollup,
        payLoadData.globalIndex,
        payLoadData.mainnetExitRoot,
        payLoadData.rollupExitRoot,
        payLoadData.originNetwork,
        payLoadData.originAddress,
        payLoadData.destinationNetwork,
        payLoadData.destinationAddress,
        payLoadData.amount,
        payLoadData.metadata
      );
      await claimTxn.wait(2);
      console.log(claimTxn.hash);
    }
  }, 60 * 60 * 1000);

  //   console.log(data)
}
bridgeAsset();
