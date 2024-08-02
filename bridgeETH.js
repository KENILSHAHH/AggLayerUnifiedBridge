/** @format */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import UnifiedBridge from './abi/UnifiedBridge.js';
import ERC20 from './artifacts/contracts/EGG.sol/EGG.json' assert { type: 'json' };
function computeGlobalIndex(indexLocal, sourceNetworkId) {
  const _GLOBAL_INDEX_MAINNET_FLAG = BigInt(2 ** 64);
  if (BigInt(sourceNetworkId) === BigInt(0)) {
    return BigInt(indexLocal) + _GLOBAL_INDEX_MAINNET_FLAG;
  } else {
    return BigInt(indexLocal) + BigInt(sourceNetworkId - 1) * BigInt(2 ** 32);
  }
}
async function bridgeAsset() {
  dotenv.config();
  const networkArray = [
    process.env.SEPOLIA_RPC,
    process.env.POLYGON_ZKEVM_CARDONA_RPC,
    process.env.ASTAR_ZKYOTO_RPC,
  ];
  const privateKey = process.env.PRIVATE_KEY;
  const unifiedBridgeContractAddress =
    '0x528e26b25a34a4a5d0dbda1d57d318153d2ed582';
  const sourceNetwork = networkArray[0]; //cardona
  const destinationNetwork = networkArray[1]; //sepolia
  const sourceNetworkId = 0;
  let destinationNetworkId = 1; //[sepolia, zkEVMCardona, astarZkyoto]
  const destinationAddress = '0x027fe3f132403C1B59DDAbA14B576D15865F69C0'; //destinationAddress you would like to receive assets on
  const tokenAddress = '0x0609cB94c3d82B93765AA2695D58ba69Cd9b462D'; //ERC20 token contract address,
  const tokenAmount = 100000000000000n; //amount of tokens to bridge ()
  const forceUpdateGlobalExitRoot = true; //true if want to update the exit root
  const sourceProvider = new ethers.providers.JsonRpcProvider(
    `${sourceNetwork}`
  );
  const permitData = '0x'; //approval of tokens to be spent by the contract on behalf of the user
  const wallet = new ethers.Wallet(privateKey, sourceProvider);

  const bridgeContract = new ethers.Contract(
    unifiedBridgeContractAddress,
    UnifiedBridge,
    wallet
  );
  const erc20Contract = new ethers.Contract(
    '0x0609cB94c3d82B93765AA2695D58ba69Cd9b462D',
    ERC20.abi,
    wallet
  );
  const mint = await erc20Contract.mint(
    '0x027fe3f132403C1B59DDAbA14B576D15865F69C0',
    1000000000000000000000000n
  );

  console.log(mint);
  const approveTxn = await erc20Contract.approve(
    '0x528e26b25a34a4a5d0dbda1d57d318153d2ed582',
    1000000000000000000000000n
  );

  console.log(approveTxn);

  let leafType;
  let originNetwork;
  let amount;
  let originAddress;
  let depositCount;
  let metadata;
  let merkleProof;

  bridgeContract.once(
    //Listen to the event to extract depositCount and other variables required to generate merkleProof
    'BridgeEvent',
    (
      _leafType,
      _originNetwork,
      _originAddress,
      _destinationNetworkId,
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
      destinationNetworkId = _destinationNetworkId;
      console.log(
        destinationNetworkId,
        originNetwork,
        originAddress,
        depositCount
      );
    }
  );

  const txn = await bridgeContract.bridgeAsset(
    destinationNetworkId,
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
    const api = `https://api-gateway.polygon.technology/api/v3/proof/testnet/merkle-proof?networkId=${sourceNetworkId}&depositCount=${depositCount}`;
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
      globalIndex: computeGlobalIndex(depositCount, sourceNetworkId).toString(),
      mainnetExitRoot: merkleProof.main_exit_root,
      rollupExitRoot: merkleProof.rollup_exit_root,
      originNetwork: originNetwork,
      originAddress: originAddress,
      destinationNetworkId: destinationNetworkId,
      destinationAddress: destinationAddress,
      amount: amount,
      metadata: metadata,
    };
    console.log(payLoadData);

    const destinationProvider = new ethers.providers.JsonRpcProvider(
      `${destinationNetwork}`
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
    const isClaimed = await destinationContract.isClaimed(
      depositCount,
      sourceNetworkId
    );
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
        payLoadData.destinationNetworkId,
        payLoadData.destinationAddress,
        payLoadData.amount,
        payLoadData.metadata
      );
      await claimTxn.wait(2);
      console.log(claimTxn.hash);
    }
  }, 15 * 60 * 1000);

  //   console.log(data)
}
bridgeAsset();
