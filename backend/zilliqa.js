const { Zilliqa } = require("@zilliqa-js/zilliqa");
const { BN, Long, bytes, units } = require("@zilliqa-js/util");
const CP = require("@zilliqa-js/crypto");
const { promisify } = require("util");
const fs = require("fs");

const CHAIN_ID = 333;
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

// const zilliqa = new Zilliqa("http://localhost:4200");
const zilliqa = new Zilliqa("https://dev-api.zilliqa.com");

const CONTRACT_PATH = "../scilla/Twitter.scilla";
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

zilliqa.wallet.addByPrivateKey(OWNER_PRIVATE_KEY);

const ownerAddress = CP.getAddressFromPrivateKey(OWNER_PRIVATE_KEY);
const contractAddress = process.env.CONTRACT_ADDRESS;
const deployedContract = zilliqa.contracts.at(contractAddress);
// const myGasPrice = new BN(units.fromQa(new BN("100"), units.Units.Li));
// const myGasPrice = units.toQa("1000", units.Units.Li);
const myGasPrice = new BN("1000000000");

const readContractFile = async (filepath) => {
  const readfile = promisify(fs.readFile);
  try {
    const content = await readfile(filepath);
    return content.toString();
  } catch (e) {
    console.error(e);
  }
};

const initParams = [
  {
    vname: "_scilla_version",
    type: "Uint32",
    value: "0"
  },
  {
    vname: "owner",
    type: "ByStr20",
    value: `${ownerAddress}`
  },
  {
    "vname": "zils_per_tweet",
    "type": "Uint128",
    "value": "1000000000000000"
  },
  {
    "vname": "blocks_per_day",
    "type": "Uint32",
    "value": "1103"
  },
  {
    vname: "hashtag",
    type: "String",
    value: "#zilliqa"
  }
];

const deployTestContract = async () => {
  console.log("deploying contract...");
  const code = await readContractFile(CONTRACT_PATH);
  const contract = zilliqa.contracts.new(code, initParams);
  try {
    const [deployTx, deployedContract] = await contract.deploy({
      version: VERSION,
      gasPrice: myGasPrice,
      gasLimit: Long.fromNumber(50000)
    });
    console.log(deployTx, deployedContract);
    console.log(deployTx.receipt);
    return deployedContract;
  } catch (e) {
    console.error(e);
  }
}

const fundAccount = async (address) => {
  const tx = await zilliqa.blockchain.createTransaction(
    zilliqa.transactions.new({
      version: VERSION,
      toAddr: `0x${address}`,
      amount: new BN(units.toQa("50", units.Units.Zil)),
      gasPrice: new BN("1000000000"),
      gasLimit: Long.fromNumber(1)
    })
  );
  return tx.receipt;
};

const registerUser = async (userAddress, username) => {

  const tx = await deployedContract.call(
    "register_user",
    [
      {
        vname: "user_address",
        type: "ByStr20",
        value: `0x${userAddress}`
      },
      { vname: "twitter_username", type: "String", value: username }
    ],
    {
      version: VERSION,
      amount: new BN(0),
      gasPrice: myGasPrice,
      gasLimit: Long.fromNumber(10000)
    }
  );
  console.log('DEPLOY TX RESULT:',tx);
  
  return tx;
};

const verifyTweet = async (data) => {
  const params = [
    {
      vname: "twitter_username",
      type: "String",
      value: `${data.username}`
    },
    {
      vname: "tweet_id",
      type: "String",
      value: `${data.tweetId}`
    },
    {
      vname: "tweet_text",
      type: "String",
      value: `${data.tweetText}`
    },
    {
      vname: "start_pos",
      type: "Uint32",
      value: `${data.startPos}`
    }
  ];
  const tx = await deployedContract.call("verify_tweet_pay", params, {
    version: VERSION,
    amount: new BN(0),
    gasPrice: new BN("1000000000"),
    gasLimit: Long.fromNumber(50000)
  });
  return tx;
};

const getTweetId = async (txnId) => {
  try {
    const tx = await zilliqa.blockchain.getTransaction(txnId);
    const { event_logs: eventLogs } = tx.receipt;

    if (!eventLogs) {
      throw new Error("No event logs for new_tweet");
    }

    const eventLog = eventLogs.find(e => e._eventname === "add_new_tweet_sucessful");
    const tweetIdParam = eventLog.params.find(p => p.vname === "tweet_id");
    return tweetIdParam.value;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getHashtag = async () => {
  try {
    const init = await zilliqa.blockchain.getSmartContractInit(contractAddress);

    const initParam = init.result.find(
      initParam => initParam.vname === "hashtag"
    );
    const hashtagVal = initParam.value;
    return hashtagVal;
  } catch (e) {
    console.error(e);
  }
};

const depositToContract = async (contract) => {
  try {
    const tx = await contract.call("deposit", [], {
      version: VERSION,
      amount: new BN(units.toQa("10000", units.Units.Zil)),
      gasPrice: new BN("1000000000"),
      gasLimit: Long.fromNumber(1000)
    });
    console.log(tx, tx.receipt);
  } catch (e) {
    console.error(e);
  }
};


const depositToAddress = async (address) => {
  try {
    const contract = zilliqa.contracts.at(address);
    const tx = await contract.call("deposit", [], {
      version: VERSION,
      amount: new BN(units.toQa("100000", units.Units.Zil)),
      gasPrice: new BN("1000000000"),
      gasLimit: Long.fromNumber(1000)
    });
    console.log(tx, tx.receipt);
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  fundAccount,
  getTweetId,
  getHashtag,
  verifyTweet,
  registerUser,
  depositToContract,
  deployTestContract,
  depositToAddress
};
