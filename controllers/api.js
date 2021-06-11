const { query } = require("express");
var express = require("express");
var router = express.Router();

module.exports = function ({ db, checkAuth }) {
  // router.get("/", expressFunctions.checkAuth, async(req, res)=>{
  //   var viewData = { config, db, req };

  //   // Customise data according to permissions
  //   if(req.user.permissions.permission_edit_roles){
  //     viewData["roles"] = await db.models.Role.findAll();
  //   } else {
  //     viewData["roles"] = {};
  //   };

  //   // Render the view
  //   res.render("client/index", viewData);
  // });

  var setupIncludes = [db.models.Track, db.models.Car, db.models.User, db.models.Rating];

    function mapSetups(setups){
      var wasArray = true;
      if(!Array.isArray(setups)){
        wasArray = false;
        setups = [setups];
      }

      var mapped = setups.map(a =>{
        var temp = Object.assign(a.dataValues, {
          car: a.Car.dataValues,
          track: a.Track.dataValues,
          author: a.User.dataValues,
          ratings: (a.Ratings.length > 0) ? a.Ratings.map(b =>{ b.dataValues }) : []
        });
        temp.downloads = String(temp.downloads);
        temp.version = String(temp.version);
        delete temp.file_data;
        delete temp.Car;
        delete temp.Ratings;
        delete temp.User;
        delete temp.Track;
        delete temp.CarId;
        delete temp.TrackId;
        return temp;
      });

      if(!wasArray){
        return mapped[0]
      }
      return mapped
    }

    router.get("/get-setups-for-app/", async(req, res)=>{
      var car = await db.models.Car.findOne({
        where: {
          ac_code: req.query.car
        }
      });

      if(car !== null){
        var setups = await db.models.Setup.findAll({
          where: {
            CarId: car._id
          },
          include: setupIncludes
        });

        if(setups !== null && setups.length !== 0){
          res.json(mapSetups(setups));
        } else {
          res.json([]);
        }
      } else {
        res.sendStatus(500);
      }

    });

    router.get("/get-setups-by-user/:user_id/:car_id", async(req, res)=>{
      var setups = await db.models.Setup.findAll({
        where: {
          UserId: req.params.user_id,
          CarId: req.params.car_id
        },
        include:setupIncludes
      });

      if(setups !== null && setups.length !== 0){
        res.json(mapSetups(setups));
      } else {
        res.json([]);
      }
    });

    router.get("/get-setup/:id", async(req, res)=>{
      var setup = await db.models.Setup.findOne({
        where: {
          _id: req.params.id
        },
        include:setupIncludes
      });
      if(setup !== null){
        var mapped = mapSetups(setup);
        res.json(mapped);
      }
    });

    router.get("/get-sim-infos/:sim", async(req, res)=>{
      var sim = await db.models.Sim.findOrCreate({
        where: {
          name: req.params.sim
        },
        include: {
          model: db.models.SimVersion,
          order: ['version', 'ASC']
        }
      });

      if(sim !== null && sim.length !== 0){
        // convert the sim.SimVersions into array of SimVersion.versions
        // var versions_list = sim[0].SimVersions.map(a =>{ a.version });
        res.json({_id: sim[0]._id, versions: ["0"]});

      } else {
        res.sendStatus(400);
      }
    });

    router.get("/get-car-by-accode/:ac_code", async(req, res)=>{
      var car = await db.models.Car.findOrCreate({
        where: {
          ac_code: req.params.ac_code
        },
        defaults: {
          name: req.params.ac_code
        }
      });

      if(car !== null && car.length !== 0){
        res.json({_id: car[0]._id})
      } else {
        res.sendStatus(500);
      }
    });

    router.get("/get-track-by-accode/:ac_code", async(req, res)=>{
      var track = await db.models.Track.findOrCreate({
        where: {
          ac_code: req.params.ac_code
        },
        defaults: {
          name: req.params.ac_code
        }
      });

      if(track !== null && track.length !== 0){
        res.json({_id: track[0]._id})
      } else {
        res.sendStatus(500);
      }
    });

    router.get("/get-user-by-steamId/:steamid", async(req, res)=>{
      // OK bad security here but once this is working remember to remove
      // Will temp just trust that this is always correct

      if(req.params.steamid == '0'){
        // Client is testing connection
        res.sendStatus(200);
      } else {
        var user = await db.models.User.findOne({
          where: {
            steam_id: req.params.steamid
          }
        });

        if(user !== null){
          res.json({_id: user._id});
        } else {
          res.json({error: 'user does not exist'});
        }
      }

    });

    router.post("/create-setup/", checkAuth, async(req,res)=>{
      if(req.files.file !== undefined && req.files.file.mimetype == 'text/plain'){
        var success = true;
        if(req.body.user_id == req.user._id){
          try{
            var data = {
              sim_version: req.body.sim_version,
              comments: req.body.comments,
              type: req.body.trim,
              best_time: req.body.best_laptime,
              CarId: req.body.car_id,
              SimId: req.body.sim_id,
              TrackId: req.body.track_id,
              UserId: req.body.user_id,
              file_name: req.body.file_name,
              file_data: req.files.file.data.toString("utf8")
            };
            var setup = await db.models.Setup.create(data);
          } catch (err){
            success= false;
          }
          if(setup !== null && success){
            res.sendStatus(200);
          } else {
            res.sendStatus(400);
          }
        } else {
          res.sendStatus(401);
        }
      }
    });

    router.post("/update-setup-with-file/", checkAuth, async(req,res)=>{
      if(req.files.file !== undefined && req.files.file.mimetype == 'text/plain'){
        var success = true;
        var setup = await db.models.Setup.findByPk(req.body.setup_id);
        if(setup.UserId == req.user._id){
          try{
            var data = {
              sim_version: req.body.sim_version,
              type: req.body.trim,
              best_time: req.body.best_laptime,
              CarId: req.body.car_id,
              SimId: req.body.sim_id,
              TrackId: req.body.track_id,
              file_name: req.body.file_name,
              file_data: req.files.file.data.toString("utf8"),
              version: setup.version + 1
            };
            await setup.update(data);
          } catch (err){
            console.log(err);
            success= false;
          }
        }
        if(setup !== null && success){
          res.sendStatus(200);
        } else {
          res.sendStatus(400);
        }
      }
    });

    router.post("/update-setup-rating-from-app/", checkAuth, async(req, res)=>{
      var user = await db.models.User.findOne({where: {steam_id: req.body.userSteamId}});
      if(user !== null){
        if(user._id == req.user._id){
          var isError = false;
          try{
            var setuprating = await db.models.Rating.findOrCreate({
              where: {
                UserId: user._id,
                SetupId: req.body.setupId
              }
            });
  
            setuprating[0].update({rating: req.body.userRating});
          } catch (err){
            isError = true;
          }
          if(!isError){
            res.sendStatus(200);
          } else {
            res.sendStatus(400);
          }
        }
      } else {
        res.sendStatus(400);
      }
    });

  return router;
};
