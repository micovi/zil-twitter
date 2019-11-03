const { zilliqa, depositToContract, depositToAddress, deployTestContract } = require("./zilliqa");

async function main() {
  //const contract = await deployTestContract();

  //console.log(deployTestContract)
  await depositToAddress('d5c6238b5c6ffda666efd553b860409123712721');
}
main();
