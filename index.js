const fs = require('fs');
const {dbPromise, addModels} = require('./db/init.js');
const port = 80;
const steamAPIKey = process.env.STEAM_KEY;
const secret = process.env.SECRET;
const serverURL= process.env.URL;

var authStrings = {};

//DB Ready
dbPromise.then((db)=> {
  console.log('Database ✔');


  //HTTP SERVER
  var http = require('http');
  const express = require('express');
  var bodyParser = require('body-parser');
  var cookieParser = require('cookie-parser')();
  var session = require('express-session');
  var SequelizeStore = require("connect-session-sequelize")(session.Store);

  var sessionStore = new SequelizeStore({
    db: db,
    checkExpirationInterval: 5 * 60 * 1000, 
    expiration: 24 * 60 * 60 * 1000
  });

  var sessionMiddleware = session({
    name: 'middleware',
    secure: false,
    secret: secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  });

  sessionStore.sync();
  var app = express();

  app.use(sessionMiddleware);
  app.use(cookieParser);
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.urlencoded({ extended: false }));
  
  var passport = require('passport');

  var SteamStrategy = require('passport-steam');
  passport.use(new SteamStrategy({
      returnURL: `${serverURL}/auth/steam/return`,
      realm: serverURL,
      apiKey: steamAPIKey
    },
    async(identifier, profile, done) =>{
      var user = await db.models.User.findOrCreate({where:{ steam_id: profile._json.steamid }})
      if(user === null){
        return done(null, false);
      }
      user[0].update({display_name: profile._json.personaname})
      return done(null, user[0].dataValues);
    }
  ));

  var LocalStrategy = require('passport-local');
  passport.use(new LocalStrategy(
    async(username, password, done)=>{
      if(username in authStrings){
        if(authStrings[username] = password){
          delete authStrings[username];
          var user = await db.models.User.findByPk(username);
          return done(null, user.dataValues);
        }
      }
      return done(null, false);
    }
  ));

  passport.serializeUser((user, done)=>{
    done(null, user._id);
  });
   
  passport.deserializeUser(async(id, done)=>{
    var user = await db.models.User.findByPk(id);
    if(user == null){
      done(false, false);
    } else {
      done(false, user.dataValues);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  console.log("Authentication ✔")

  app.get('/failed', async(req,res)=>{
    res.send("Authentication failed");
  });

  // Upload middleware
  const fileUpload = require('express-fileupload');
  app.use(fileUpload({
    limits: { fileSize:1024 * 1024 }
  }));


  var server = http.createServer({}, app);
  server.listen(port, function(){
    console.log("HTTPS Server ✔")
  });

  async function checkAuth(req, res, next){
    if (req.isAuthenticated()) {
      return next();
    }
    res.sendStatus("401");
  }

  var controllerParams = {
    db,
    authStrings,
    passport,
    checkAuth
  };
  
  var apiController = require('./controllers/api.js')(controllerParams);
  var fileController = require('./controllers/setup-files.js')(controllerParams);
  var authController = require('./controllers/auth.js')(controllerParams);
  
  app.use('/api', apiController);
  app.use('/auth', authController);
  app.use('/setup_files', fileController);
  
  console.log("Controllers ✔")
});
