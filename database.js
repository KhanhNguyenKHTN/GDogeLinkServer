var lib = require('./lib');
var mysql = require('mysql');
const e = require('express');

var feeWidthAirdrop = 0.004;
var curPrice = 50000000;
var con = mysql.createConnection({
  host: "8.210.245.100",
  user: "pugswap",
  password: "123456aA@",
  database: "GoldPugDb"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected Database!");
});

//#region  Register or handle account
function GetUser(address, parent, callback){
  try {
    con.query(`SELECT * FROM UserAccount WHERE Address = ?`, [address.toLowerCase()], function (err, results, fields) {
      if (err) {
        return callback({ err: err, data: undefined });
      }
      if (results.length < 1) {
        var newQuery;
        var parameter;
        if (parent !== null && parent !== undefined && parent !== "") {
          newQuery = `INSERT INTO UserAccount (Address, AirdropBalance, PreSaleBalance, Staking, RefUser, IsActive, IsStaking, Parent, CreatedDate) 
                      VALUES ( ? , 500000, 0, 0, 0, 0, 0, ?, CURDATE());`;
          parameter = [address.toLowerCase(), parent.toLowerCase()];
          UpdateParentAirdrop(parent.toLowerCase());
        }
        else {
          newQuery = `INSERT INTO UserAccount (Address, AirdropBalance, PreSaleBalance, Staking, RefUser, IsActive, IsStaking, Parent, CreatedDate) 
                      VALUES ( ? , 500000, 0, 0, 0, 0, 0, NULL, CURDATE());`;
          parameter = [address.toLowerCase()]
        }
        //No Address, insert user
        con.query(newQuery, parameter, function (err1, results1, fields1) {
          var id = parseInt(results1.insertId);
          con.query(`SELECT * FROM UserAccount WHERE Id = ?`, [id], function (err2, results2, fields2) {
            return callback({ account: results2[0], err: undefined, fee: feeWidthAirdrop, price: curPrice });
          });
        });
      } else {
        var res = { account: results[0], err: undefined, fee: feeWidthAirdrop, price: curPrice };
        return callback(res);
      }

    });
  } catch (mes) {
    var res = { err: mes };
    return callback(res);
  }
}
exports.GetUserAddress = function (address, parent, callback) {
  GetUser(address, parent, callback);
}
function UpdateParentAirdrop(parent){
  con.query(`UPDATE UserAccount SET AirdropBalance = AirdropBalance + 10000, IsActive = 1 WHERE Address = ?;`, [parent], function (err, results, fields) {});
}
//#endregion Register or handle account

//#region Claim Airdrop
exports.ClaimAirdrop = function(address, callback) {
  try {
    con.query(`UPDATE UserAccount SET Balance = Balance + AirdropBalance, AirdropBalance = 0, IsActive = 1 WHERE Address = ?`, [address.toLowerCase()], function(err, results, fields) {
      if(err){
        return callback({message: 'ERROR'});
      }else{
        GetUser(address, undefined, function(data) {
          var newData = {
            message: 'the GDL has been sent to your account balance',
            data: data
          }
          return callback(newData);
        });
      }
    });
  }
  catch {
    return callback({message: 'ERROR'});
  }
};
//#endregion Claim Airdrop

//#region PreSale
exports.PreSaleToken = function (data, callback) {
  try {
    con.query(`select * from UserTransaction where ReceiveHash = ?`, [data.hash.toLowerCase()], function(e1,r1,f1){
      if(e1){
        isInvalid = true;
        return callback({ message: "ERROR"});
      }
      if(r1.length > 0) {
        isInvalid = true;
        return callback({message: "ERROR: Transaction is invalid"});
      }else{
        lib.GetHashToVerified(data.hash, function (verified) {
          if (verified.isValid === false) {
            return callback({ message: "ERROR: " + verified.message });
          }

          
          //Convert to GDL
          var total = verified.quantity * curPrice;
          var InsertQuery = `INSERT INTO UserTransaction (FromAddress, ToAddress, BNBAmount, TokenAmount, CurrentPrice, ReceiveHash, CreateDate, HasConfirm, ConfirmDate)
          VALUES(?, ?, ?, ?, ?, ?, CURDATE(), 1, CURDATE());`;
          var parameter = [verified.from, verified.to, verified.quantity, total, curPrice, verified.hash];
          try {
            con.query(InsertQuery, parameter, function (err1, res1, fe1) {
    
              con.query(`UPDATE UserAccount SET PreSaleBalance = PreSaleBalance + ?, Balance = Balance + ?, IsJoinPresale = 1 WHERE Address = ?;`,
                [total, total, data.address.toLowerCase()], function (err, res, feild) {
                  if (err) {
                    console.log(err);
                  }
                  GetUser(data.address.toLowerCase(), undefined, function (res) {
                    var newData = {
                      message: 'the GDL has been sent to your account balance',
                      data: res
                    }
                    return callback(newData);
                  });
                });
    
            });
          } catch (error) {
            return callback({ message: 'ERROR' });
          }
    
        });
      }
    });
  } catch {
    return callback({ message: 'ERROR' });
  }
};
////#endregion PreSale

//#region StakingToken
exports.StakingToken = function(data, callback){
  try {
    con.query(`select * from UserTransaction where ReceiveHash = ?`, [data.hash.toLowerCase()], function(e1,r1,f1){
      if(e1){
        return callback({ message: "ERROR"});
      }
      else if(r1.length > 0) {
        return callback({message: "ERROR: Hash is invalid"});
      }else{
        try {
          con.query('SELECT * FROM UserAccount WHERE Address = ?', [data.address.toLowerCase()], function(e3, r3, f3) {
            //Convert to GDL
            var total = data.staking;
            var obj = JSON.parse(JSON.stringify(r3[0]));
            var currentEarn = 0;
            if(r3.length === 0){
              return callback({message: "ERROR: Can't find account"});
            }
            else if (r3[0].Balance < total){
              return callback({message: "ERROR: Your account balance is not enough GDL"});
            }
            else{
              lib.GetHashToVerified(data.hash, function (verified) {
                if (verified.isValid === false) {
                  return callback({ message: "ERROR: " + verified.message });
                }
                if(obj.IsStaking.data[0] === 1){
                  var dt = lib.getCurrentTime() - Math.floor((new Date(obj.StakingDate)).getTime()/1000);
                  currentEarn = Math.ceil(obj.StakingLock + obj.Staking * (dt * 100) / (30*24*60*60) / 100);
                }
    
                var InsertQuery = `INSERT INTO UserTransaction (FromAddress, ToAddress, BNBAmount, TokenAmount, CurrentPrice, ReceiveHash, CreateDate, HasConfirm, ConfirmDate)
                VALUES(?, ?, ?, ?, ?, ?, CURDATE(), 1, CURDATE());`;
                var parameter = [verified.from, verified.to, verified.quantity, total, curPrice, verified.hash];
                try {
                  con.query(InsertQuery, parameter, function (err1, res1, fe1) {
          
                    con.query(`INSERT INTO StakingInfo (AccountAddress, TokenAmount, HasConfirm) VALUES (?, ?, 1)`, [data.address.toLowerCase(), total], function(e2, r2, f2) {
                      con.query(`UPDATE UserAccount SET Staking = Staking + ?, Balance = Balance - ?, StakingDate = CURRENT_TIMESTAMP(), StakingLock = ?, IsStaking = 1 WHERE Address = ?;`,
                        [total, total, currentEarn, data.address.toLowerCase()], function (err, res, feild) {
                          if (err) {
                            console.log(err);
                          }
                          GetUser(data.address.toLowerCase(), undefined, function (res) {
                            var newData = {
                              message: `Staking is success`,
                              data: res
                            }
                            return callback(newData);
                          });
                        });
                    })
          
                  });
                } catch (error) {
                  return callback({ message: 'ERROR' });
                }
          
              });
            }
  
          });
        } catch (errorz) {
          return callback({ message: 'ERROR' });
        }
        
      }
    });
  } catch (err) {
    console.log('ERROR: ', err);
    return callback({ message: 'ERROR' });
  }
};
//#region  StakingToken

//#region UnStaking
exports.UnStakingToken = function(data, callback){
  try {
    con.query(`select * from UserTransaction where ReceiveHash = ?`, [data.hash.toLowerCase()], function(e1,r1,f1){
      if(e1){
        return callback({ message: "ERROR"});
      }
      else if(r1.length > 0) {
        return callback({message: "ERROR: Transaction is invalid"});
      }else{
        try {
          con.query('SELECT * FROM UserAccount WHERE Address = ?', [data.address.toLowerCase()], function(e3, r3, f3) {
            //Convert to GDL
            var total = data.staking;
            var obj = JSON.parse(JSON.stringify(r3[0]));
            var currentEarn = 0;
            if(r3.length === 0){
              return callback({message: "ERROR: Can't find account"});
            }
            else if (r3[0].staking < total){
              return callback({message: "ERROR: Your staking balance is not enough GDL"});
            }
            else{
              lib.GetHashToVerified(data.hash, function (verified) {
                if (verified.isValid === false) {
                  return callback({ message: "ERROR: " + verified.message });
                }
                if(obj.IsStaking.data[0] === 1){
                  var dt = lib.getCurrentTime() - Math.floor((new Date(obj.StakingDate)).getTime()/1000);
                  currentEarn = Math.ceil(obj.StakingLock + obj.Staking * (dt * 100) / (30*24*60*60) / 100);
                }
    
                var InsertQuery = `INSERT INTO UserTransaction (FromAddress, ToAddress, BNBAmount, TokenAmount, CurrentPrice, ReceiveHash, CreateDate, HasConfirm, ConfirmDate)
                VALUES(?, ?, ?, ?, ?, ?, CURDATE(), 1, CURDATE());`;
                var parameter = [verified.from, verified.to, verified.quantity, total, curPrice, verified.hash];
                try {
                  con.query(InsertQuery, parameter, function (err1, res1, fe1) {
          
                    con.query(`INSERT INTO StakingInfo (AccountAddress, TokenAmount, HasConfirm) VALUES (?, ?, 1)`, [data.address.toLowerCase(), -total], function(e2, r2, f2) {
                      con.query(`UPDATE UserAccount SET Staking = Staking - ?, Balance = Balance + ?, StakingDate = CURRENT_TIMESTAMP(), StakingLock = ?, IsStaking = 1 WHERE Address = ?;`,
                        [total, total, currentEarn, data.address.toLowerCase()], function (err, res, feild) {
                          if (err) {
                            console.log(err);
                          }
                          GetUser(data.address.toLowerCase(), undefined, function (res) {
                            var newData = {
                              message: `Staking is success`,
                              data: res
                            }
                            return callback(newData);
                          });
                        });
                    })
          
                  });
                } catch (error) {
                  return callback({ message: 'ERROR' });
                }
          
              });
            }
  
          });
        } catch (errorz) {
          return callback({ message: 'ERROR' });
        }
        
      }
    });
  } catch (err) {
    console.log('ERROR: ', err);
    return callback({ message: 'ERROR' });
  }
};
//#endregion UnStaking


//#region Deposit Token
exports.DepositToken = function (data, callback) {
  try {
    var hash = data.hash.hash.toLowerCase()
    con.query(`select * from UserTransaction where ReceiveHash = ?`, [hash], function(e1,r1,f1){
      if(e1){
        isInvalid = true;
        return callback({ message: "ERROR"});
      }
      if(r1.length > 0) {
        isInvalid = true;
        return callback({message: "ERROR: Transaction is invalid"});
      }else{
        lib.GetHashTokenToVerified(hash, function (verified) {
          if (verified.isValid === false) {
            return callback({ message: "ERROR: " + verified.message });
          }

          
          //Convert to GDL
          var total = verified.quantity;
          var InsertQuery = `INSERT INTO UserTransaction (FromAddress, ToAddress, BNBAmount, TokenAmount, CurrentPrice, ReceiveHash, CreateDate, HasConfirm, ConfirmDate)
          VALUES(?, ?, 0, ?, 0, ?, CURDATE(), 1, CURDATE());`;
          var parameter = [verified.from, verified.to, verified.quantity, verified.hash];
          try {
            con.query(InsertQuery, parameter, function (err1, res1, fe1) {
    
              con.query(`UPDATE UserAccount SET Balance = Balance + ? WHERE Address = ?;`,
                [total, data.address.toLowerCase()], function (err, res, feild) {
                  if (err) {
                    console.log(err);
                  }
                  GetUser(data.address.toLowerCase(), undefined, function (res) {
                    var newData = {
                      message: 'the GDL has been sent to your account balance',
                      data: res
                    }
                    return callback(newData);
                  });
                });
    
            });
          } catch (error) {
            return callback({ message: 'ERROR' });
          }
    
        });
      }
    });
  } catch {
    return callback({ message: 'ERROR' });
  }
};
//#endregion

//#region Width
exports.WithDrawToken = function(data, callback){
  try {
    con.query(`select * from UserTransaction where ReceiveHash = ?`, [data.hash.toLowerCase()], function(e1,r1,f1){
      if(e1){
        return callback({ message: "ERROR"});
      }
      else if(r1.length > 0) {
        return callback({message: "ERROR: Hash is invalid"});
      }else{
        try {
          con.query('SELECT * FROM UserAccount WHERE Address = ?', [data.address.toLowerCase()], function(e3, r3, f3) {
            //Convert to GDL
            var total = data.staking;
            var currentEarn = 0;
            if(r3.length === 0){
              return callback({message: "ERROR: Can't find account"});
            }
            else if (r3[0].Balance < total){
              return callback({message: "ERROR: Your account balance is not enough GDL"});
            }
            else{
              lib.GetHashToVerified(data.hash, function (verified) {
                if (verified.isValid === false) {
                  return callback({ message: "ERROR: " + verified.message });
                }    
                var InsertQuery = `INSERT INTO UserTransaction (FromAddress, ToAddress, BNBAmount, TokenAmount, CurrentPrice, ReceiveHash, CreateDate, HasConfirm, ConfirmDate)
                VALUES(?, ?, ?, ?, ?, ?, CURDATE(), 1, CURDATE());`;
                var parameter = [verified.from, verified.to, verified.quantity, total, curPrice, verified.hash];
                try {
                  con.query(InsertQuery, parameter, function (err1, res1, fe1) {
          
                    con.query(`INSERT INTO WithdrawRequest (FromAddress, BNBAmount, TokenAmount, FeePrice, ReceiveHash, HasConfirm)
                                VALUES (?, ?, ?, ?, ?, TRUE);`, [data.address.toLowerCase(), verified.quantity, total, feeWidthAirdrop, data.hash], function(e2, r2, f2) {
                      con.query(`UPDATE UserAccount SET Balance = Balance - ? WHERE Address = ?;`,
                        [total, data.address.toLowerCase()], function (err, res, feild) {
                          if (err) {
                            console.log(err);
                          }
                          GetUser(data.address.toLowerCase(), undefined, function (res) {
                            var newData = {
                              message: `Withdraw request is in process`,
                              data: res
                            }
                            return callback(newData);
                          });
                        });
                    })
          
                  });
                } catch (error) {
                  return callback({ message: 'ERROR' });
                }
          
              });
            }
  
          });
        } catch (errorz) {
          return callback({ message: 'ERROR' });
        }
        
      }
    });
  } catch (err) {
    console.log('ERROR: ', err);
    return callback({ message: 'ERROR' });
  }
};
//#region 