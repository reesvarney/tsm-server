var express = require("express");
var router = express.Router();
var stream = require('stream');

module.exports = function ({ db }) {
  router.get("/:sim_id/:setup_id", async(req, res)=>{
    
    var setup = await db.models.Setup.findOne({
      where: {
        _id: req.params.setup_id,
        SimId: req.params.sim_id
      }
    });

    if(setup !== null){
      var fileContents  = Buffer.from(setup.file_data,'utf8');
      var readStream = new stream.PassThrough();
      readStream.end(fileContents);
      res.set('Content-disposition', 'attachment; filename=' + setup.file_name);
      res.set('Content-Type', 'text/plain');
      readStream.pipe(res);
      var newDownloads = setup.downloads + 1;
      setup.update({
        downloads: newDownloads
      });
    }else {
      res.sendStatus(404);
    }
  });


  return router;
};
