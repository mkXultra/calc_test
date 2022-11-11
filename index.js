const fs = require('fs')

// const target = "./export_check_pre.json"
// const target = "./export_check2.json"
const target = "./export_check5.json"
const debugMode = true
const exceptionAddresses = [
  {
    address: 'ununifi1a8jcsmla6heu99ldtazc27dna4qcd4jygsthx6',
  },

  {
    address: 'ununifi1d6zd6awgjxuwrf4y863c9stz9m0eec4ghfy24c',
  },
  {
    address: 'ununifi1wgjh88unam4tuln0ju6l6q6cd08zk2vs87uytv',
  }
]

const nftClassPointTypes = {
  "a10": {
    expectType:4,
    point:10
  },
  "b10": {
    expectType:2,
    point:10
  },
  "c10": {
    expectType:3,
    point:10
  },
  "d10": {
    expectType:0,
    point:10
  },
}

const stakingDenom = "uguu"

function main(params) {
  const exportStr = fs.readFileSync(target)  
  const exportJson = JSON.parse(exportStr)
  // console.log("🚀 ~ file: index.js ~ line 6 ~ main ~ exportJson", exportJson.app_state.auth.accounts)
  let baseAccounts = exportJson.app_state.auth.accounts.filter(el => el["@type"] == "/cosmos.auth.v1beta1.BaseAccount")
  baseAccounts = baseAccounts.filter(el => !exceptionAddresses.find(ex => ex.address == el.address))


  // console.log("🚀 ~ file: index.js ~ line 6 ~ main ~ exportJson", exportJson.app_state.distribution.delegator_starting_infos)
  const delegator_starting_infos = exportJson.app_state.distribution.delegator_starting_infos.filter(el => baseAccounts.find(account => account.address == el.delegator_address) )
  console.log("🚀 ~ file: index.js ~ line 22 ~ main ~ delegator_starting_infos", delegator_starting_infos)

  // console.log("🚀 ~ file: index.js ~ line 8 ~ main ~ baseAccounts", baseAccounts)
  let amounts = exportJson.app_state.bank.balances.filter(el => baseAccounts.find(account => account.address == el.address) )
  console.log("🚀 ~ file: index.js ~ line 9 ~ main ~ amounts", JSON.stringify(amounts, "", 2))
  JSON.parse(JSON.stringify(amounts))
  console.log("---------------------");
  console.log("---------------------");
  amounts = amounts.reduce((acc,el) =>{
    const delInfo = delegator_starting_infos.find(stakeInfo => stakeInfo.delegator_address == el.address)
    if(delInfo){
      const denomAmount = el.coins.find(el => el.denom == stakingDenom)
      if(!denomAmount){
        el.coins.push(
          {
            "amount":delInfo.starting_info.stake,
            "denom":stakingDenom
          }
        )
      }else{
        denomAmount.amount =  String(parseInt(denomAmount.amount) + parseInt(delInfo.starting_info.stake))
      }
    }
    acc.push(el)
    return acc
  },[])
  console.log("---------------------");
  console.log("🚀 ~ file: index.js ~ line 12 ~ main ~ JSON.parse(JSON.stringify(amounts))", (JSON.stringify(amounts,"", 2)))

  const sortedAmount = amounts.sort(sortByAmount("uguu"))
  console.log("🚀 ~ file: index.js ~ line 14 ~ main ~ sortedAmount", JSON.stringify(sortedAmount,"", 2))

  exportJson.app_state.nft.entries
  console.log("🚀 ~ file: index.js ~ line 56 ~ main ~ exportJson.app_state.nft.entries", exportJson.app_state.nft.entries)
  amounts = amounts.reduce((acc, item) =>{
    let nft = exportJson.app_state.nft.entries.find(el => el.owner == item.address)
    if(nft){
      item.nfts = nft.nfts
      item.nftTottalValue = calcValForNfts(item.address, nft.nfts)
    }
    acc.push(item)
    return acc
  },[]) 
  console.log("🚀 ~ file: index.js ~ line 62 ~ main ~ amounts", amounts)
}

function changeQuinary(num) {
  return num%5 
}
function getLastNum(num) {
 return parseInt(num)%10 
}

function calcValForNft(address, nft) {
  const lastChar = address.slice( -1 ) ;
  const lastCharCode = lastChar.charCodeAt(0) 
  const userPointType = changeQuinary(getLastNum(lastCharCode)) 
  const nftLastChar = nft.id.slice( -1 ) ;
  const nftPointVal = changeQuinary(getLastNum(nftLastChar))
  if(debugMode){
    console.log("🚀 ~ file: index.js ~ line 78 ~ calcValForNft ~ address", address)
    console.log("🚀 ~ file: index.js ~ line 80 ~ calcValForNft ~ lastCharCode", lastCharCode)
    console.log("🚀 ~ file: index.js ~ line 88 ~ calcValForNft ~ userPointType", userPointType)
    console.log("🚀 ~ file: index.js ~ line 117 ~ calcValForNft ~ nft.class_id", nft.class_id)
    console.log("🚀 ~ file: index.js ~ line 116 ~ calcValForNft ~ nft.id", nft.id)
  }

  const pointType = nftClassPointTypes[nft.class_id]
  if(pointType.expectType == userPointType){
    if(nftPointVal == userPointType){
      return pointType.point * pointType.point
    }else{
      return pointType.point
    }
  }else{
    return 1
  }
}


function calcValForNfts(address, nfts) {
  return nfts.reduce((acc, item) =>{
    acc += calcValForNft(address, item)
    return acc
  },0)
  
}

function sortByAmount(denom){
  return function(a,b){
    let denomAmountA =  a.coins.find(el => el.denom == denom)
    let denomAmountB =  b.coins.find(el => el.denom == denom)
    if(!denomAmountA){
      denomAmountA = {
        "amount":"0",
        denom
      }
    }
    if(!denomAmountB){
      denomAmountB = {
        "amount":"0",
        denom
      }
    }
    const bigDenomAmountA = parseInt(denomAmountA.amount)
    const bigDenomAmountB = parseInt(denomAmountB.amount)
    return Number(bigDenomAmountB - bigDenomAmountA)
  }
}

main()