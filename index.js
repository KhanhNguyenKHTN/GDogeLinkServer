var db = require('./database');
const express = require('express');
var cors = require('cors');
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

router.post('/user', function(req,res){
    try{
        var address = req.body.address;
        var parent = req.body.parent;
        res.setHeader('Content-Type', 'application/json');
        db.GetUserAddress(address, parent, function(result) {
            if(result.err){
                res.send('ERROR');
            }else{
                res.send(JSON.stringify(result));
            }
        });
    }catch{
        res.send(JSON.stringify({message: 'ERROR'}));
    }
});

router.post('/Claim', function(req,res){
    try{
        var address = req.body.address;
        res.setHeader('Content-Type', 'application/json');
        db.ClaimAirdrop(address, function(result) {
            res.send(JSON.stringify(result));
        });
    }catch{
        res.send(JSON.stringify({message: 'ERROR'}));
    }
});

router.post('/presale', function(req,res){
    try{
        var body = req.body;
        res.setHeader('Content-Type', 'application/json');

        db.PreSaleToken(body, function(result) {
            res.send(JSON.stringify(result));
        });
    }catch{
        res.send(JSON.stringify({message: 'ERROR'}));
    }
});

router.post('/deposit', function(req,res){
    try{
        var body = req.body;
        res.setHeader('Content-Type', 'application/json');

        db.DepositToken(body, function(result) {
            res.send(JSON.stringify(result));
        });
    }catch{
        res.send(JSON.stringify({message: 'ERROR'}));
    }
});

router.post('/withdraw', function(req,res){
    try{
        var body = req.body;
        res.setHeader('Content-Type', 'application/json');

        db.WithDrawToken(body, function(result) {
            res.send(JSON.stringify(result));
        });
    }catch{
        res.send(JSON.stringify({message: 'ERROR'}));
    }
});

router.post('/staking', function(req,res){
    try{
        var body = req.body;
        res.setHeader('Content-Type', 'application/json');
        db.StakingToken(body, function(result) {
            res.send(JSON.stringify(result));
        });
    }catch{
        res.send(JSON.stringify({message: 'ERROR'}));
    }
});

router.post('/unstaking', function(req,res){
    try{
        var body = req.body;
        res.setHeader('Content-Type', 'application/json');
        db.UnStakingToken(body, function(result) {
            res.send(JSON.stringify(result));
        });
    }catch{
        res.send(JSON.stringify({message: 'ERROR'}));
    }
});

app.use('/', router);
app.listen(process.env.port || 9015);
console.log('Running at Port http://localhost:9015/');