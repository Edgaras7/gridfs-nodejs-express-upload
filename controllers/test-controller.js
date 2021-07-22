var formidable = require('formidable');
var mongoose = require('mongoose');  
var fs = require('fs'); 
var test_model = require('../models/test-model'); 
 

var Grid = mongoose.model(process.env.BUCKET_NAME, test_model.gridSchema, process.env.BUCKET_NAME+".files" );

module.exports = {

    mongo_connect: function(){

      mongoose.connect(process.env.MONGO_CONNECT, {useNewUrlParser: true, useUnifiedTopology: true}); 
      const conn = mongoose.connection;

      return conn;

    },

    fileForm: function(req, res) {

      module.exports.mongo_connect();
         
      Grid.find({},function(err,gridfiles) {

        if (err) throw err; 
        res.render('index', { filelist: gridfiles });

      });
 
    },

    uploadFile: async function(req,res){ 
        const form = formidable({ multiples: true });

        form.parse(req, (err, fields, files) => {
            if (err) {
              next(err);
              return;
            } 
        
            module.exports.runUpload(files['file']).then(function(d){
              res.redirect('back');
            });
              
        }); 
         
    },

    saveFile: function(b, p, fn, ft){

        return new Promise((resolve, reject) => {
          fs.createReadStream(p)
            .pipe(b.openUploadStream(fn, { metadata:{ field: "some meta information" }, contentType: ft}))
            .on('error', function (err) { reject(err); })
            .on('finish', function (file) { resolve(file); });
        });

    },

    runUpload: async function(file){
  
        var conn = module.exports.mongo_connect();

        await conn;
        
        const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: process.env.BUCKET_NAME });
        
        await module.exports.saveFile(bucket, file.path, file.name, file.type).then(function(data){
          console.log(data);
          return conn.close();
        });
         
         

    },

    deleteFile: function(req, res){

      var conn = module.exports.mongo_connect();

      const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: process.env.BUCKET_NAME });
      bucket.delete(new mongoose.mongo.ObjectID(req.params.id), (err, data) => {
        if (err) {
          return res.status(404).json({ err: err.message });
        } 
    
        res.redirect('/');
      });
       
    },

    downloadFile: function(req, res){

      var conn = module.exports.mongo_connect();  
 
      Grid.findOne({ _id: new mongoose.mongo.ObjectID(req.params.id) }, function (err, file) {
  
        const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: process.env.BUCKET_NAME }); 
        const downloadStream = bucket.openDownloadStream(new mongoose.mongo.ObjectID(req.params.id));

        downloadStream.on('data', (chunk) => {
            res.write(chunk); 
        });

        downloadStream.on('error', () => {
            res.sendStatus(404);
        });
      
        downloadStream.on('end', () => {
            res.end();
        });

        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');
        
        return res;
      

    });



    }


}