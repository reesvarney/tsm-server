var express = require("express");
var router = express.Router();
var keypair = require('keypair');
var crypto = require('crypto');

module.exports = function ({ db, passport, authStrings, checkAuth }) {
  // steam auth
  var userIPs = {};

  router.get('/steam', passport.authenticate('steam'),function(req, res) {});

  router.get('/steam/return', passport.authenticate('steam', { failureRedirect: '/failed' }), function(req, res) {
      // Successful authentication
      // temporarily authenticate the ip to receive the private key
      var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      userIPs[req.user._id] = ip;
      res.send("Logged in: You can now close this window, the app will authenticate itself");
      req.logout();
    }
  );

  router.get('/get-new-privkey/:steam_id', async(req,res)=>{
    // Gets private key, returns with user id
    // generate a new private key if one already exists
    // store public key in db
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var user = await db.models.User.findOne({where: {steam_id : req.params.steam_id}});
    if(user !== null){
      if(userIPs[user._id] == ip){
        var pair = keypair();
        user.update({public_key: pair.public});
        res.json({user_id: user._id, privateKey: pair.private});
      } else {
        res.json({error: "User not authenticated for this IP address"});
      }
    } else {
      res.json({error: "User does not exist"});
    }
  })

  router.get('/get-encrypted-data/:user_id', async(req,res)=>{
    var user = await db.models.User.findByPk(req.params.user_id);
    if(user !== null){
      var randomBytes = crypto.randomBytes(64).toString('utf8');
      if(user.public_key === "" ){
        res.json({error: "Public key empty"});
      } else {
        var encrypted = crypto.publicEncrypt(user.public_key, Buffer.from(randomBytes, "utf8")).toString('base64');
        console.log(`Encrypted data: ${encrypted}`)
        authStrings[user._id] = randomBytes;
        res.json({data: encrypted});
      }
    }
  })

  router.post('/app-login', passport.authenticate('local', { failureRedirect: '/failed' }), async(req,res)=>{
    res.sendStatus(200);
  });

  
  router.get('/check', checkAuth, async(req,res)=>{
    res.json({
      status: "logged in",
      user: req.user
  });
  });

  router.get('/logout', function(req, res){
    if(req.isAuthenticated()){
      req.logout();
      res.sendStatus(200);
    } else {
      res.sendStatus(401)
    }
  });
  
  return router;
};
