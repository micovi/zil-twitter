const { Zilliqa } = require("@zilliqa-js/zilliqa");
const { BN, Long, bytes } = require("@zilliqa-js/util");

const CHAIN_ID = 333;
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

const contractAddress = "776f230Bb317015C920928ad32267519DB306881";
export const zilliqa = new Zilliqa("https://dev-api.zilliqa.com");
const contract = zilliqa.contracts.at(contractAddress);
const myGasPrice = new BN("1000000000");

export const getTweetStatus = async (tweetId, userAddress) => {
  const state = await contract.getState();
  const verifiedTweets = Object.keys(state.verified_tweets);

  const tweetIsVerified = !!verifiedTweets.find(v => v === tweetId);

  let alreadySent = false;

  // Check when it was submitted
  if(!tweetIsVerified) {
    const lastWithdrawalIndex = Object.keys(state.last_withdrawal).findIndex(v => v === "0x"+userAddress);

    if(lastWithdrawalIndex !== -1) {

      // get when last tweet was submitted
      const lastWithdrawals = Object.values(state.last_withdrawal);
      const submittedBlock = lastWithdrawals[lastWithdrawalIndex];

      // get current blockchain block
      const blockChainInfo = await zilliqa.blockchain.getBlockChainInfo();
      const currentTxBlock = parseInt(blockChainInfo.result.NumTxBlocks);
      
      // get blocks_per_day value from contract
      const init = await contract.getInit();
  
      const blocksPerDay = init.find(item => item.vname === 'blocks_per_day');

      if(submittedBlock + parseInt(blocksPerDay.value) > currentTxBlock) {
        alreadySent = true;
      }
    }
    
  }

  return { isVerified: tweetIsVerified, isRegistered: !!tweetIsVerified, alreadySent };
};

export const isUserRegistered = async (username) => {
  const state = await contract.getState();

  if (state.users !== undefined) {
    const isUsed = Object.keys(state.users).find(u => u.toLowerCase() === username.toLowerCase());
    return !!isUsed;
  } else {
    throw new Error('There is a problem with the contract.');
  }
};

export const submitTweet = async (privateKey, data, passphrase) => {
  const wallet = await zilliqa.wallet.addByKeystore(privateKey, passphrase);

  try {
    const tx = await contract.call(
      "verify_tweet_pay",
      [
        {
          vname: "tweet_id",
          type: "String",
          value: `${data.tweetId}`
        },
        {
          "vname": "twitter_username",
          "type": "String",
          "value": `${data.username}`
        },
        {
          "vname": "tweet_text",
          "type": "String",
          "value": `${data.tweetText}`
        },
        {
          "vname": "start_pos",
          "type": "Uint32",
          "value": `${data.startPos}`
        }
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(50000)
      }
    );
    return tx;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to submit tweet. Please make sure the private key used is correct, and that the tweet is not already submitted.");
  }
};
