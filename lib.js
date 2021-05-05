const Web3 = require('web3');

//const web3 = new Web3('https://bsc-dataseed1.binance.org:443');//Main net
const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545'); //Test net

const _mainAddress = '0x5e89e841c828cf587b1d8b9ffd90977a03cc7f10';
const _rawInclude = '5e89e841c828cf587b1d8b9ffd90977a03cc7f10';

const _contract = '0xF16b365FDEb71E8011a921807B3FFD8D37BA70c2'; //Test net

exports.GetHashToVerified = function(hash, callback) {
    var result = {};
    try {
        web3.eth.getTransaction(hash, function(err, trans) {
            try {
                if(err){
                    result.isValid = false;
                    result.message = "Can't this transaction check hash";
                    return callback(result);
                }
                if(trans === undefined || trans.from == undefined) {
                    result.isValid = false;
                    result.message = "Hash is invalid";
                }
                else
                {
                  if(trans.to.toLowerCase() !== _mainAddress) {
                    result.isValid = false;
                    result.message = "Receive Wallet is not presale wallet";
                  } else {
                    result.isValid = true;
                    result.message = "Hash is valid";
                    result.from = trans.from.toLowerCase();
                    result.hash = trans.hash.toLowerCase();
                    result.to = trans.to.toLowerCase();
                    result.quantity = GetValueFromHash(trans.value);
                    return callback(result);
                  }
                }
                return callback(result);
            } catch (error) {
                result.isValid = false;
                result.message = "Can't check this transaction hash";
                return callback(result);
            }
          });
    } catch (error) {
        result.isValid = false;
        result.message = "Can't check this transaction hash";
        return callback(result);
    }
}

exports.GetHashTokenToVerified = function(hash, callback) {
    var result = {};
    try {
        web3.eth.getTransaction(hash, function(err, trans) {
            try {
                if(err){
                    result.isValid = false;
                    result.message = "Can't this transaction check hash";
                    return callback(result);
                }
                if(trans === undefined || trans.from == undefined) {
                    result.isValid = false;
                    result.message = "Hash is invalid";
                }
                else
                {
                  if(trans.input === undefined || trans.input.includes(_rawInclude) === false) {
                    result.isValid = false;
                    result.message = "Receive Wallet is not presale wallet";
                  } else {
                    result.isValid = true;
                    result.message = "Hash is valid";
                    result.from = trans.from.toLowerCase();
                    result.hash = trans.hash.toLowerCase();
                    result.to = _mainAddress;
                    result.quantity = GetValueFromInput(trans.input);
                    return callback(result);
                  }
                }
                return callback(result);
            } catch (error) {
                result.isValid = false;
                result.message = "Can't check this transaction hash";
                return callback(result);
            }
          });
    } catch (error) {
        result.isValid = false;
        result.message = "Can't check this transaction hash";
        return callback(result);
    }
}

function GetValueFromHash(zValue){
    let sInte;
    let sDec;
    strValue = zValue.toString();
    if(strValue.length > 18)
    {
        sDec = strValue.slice(-18);
        sInte = strValue.split(sDec).join("");
    }else{
        sInte = '0';
        sDec = strValue.padStart(18, '0');
    }
    sDec = RemoveOldDoor(sDec);
    sDec = sInte + '.' + sDec;
    return parseFloat(sDec);
}

function RemoveOldDoor(parameter){
    var sData = parameter;
    var index = 17;
    while(index >= 0 && parameter[index] == '0')
    {   
        sData = parameter.substring(0, index);
        index--;
    }
    return sData;
}

exports.getCurrentTime = function () {
    // create Date object for current location
    var d = new Date();
  
    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  
    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + (3600000*'+8'));
  
    // return time as a string
    return Math.floor(nd.getTime()/1000);
  };

function GetValueFromInput(input) {
    var i = 10 + 64;
    var res = input.slice(i, input.length);
    var newz = web3.utils.hexToNumberString( '0x' + res);
    return GetValueFromHash(newz);
};