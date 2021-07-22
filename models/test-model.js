var mongoose = require('mongoose');  
Schema = mongoose.Schema;

module.exports={   
    gridSchema: new Schema({
        filename: String,
        contentType: String,
        md5: String,
        uploadDate: Date
    },{ strict: false })
}