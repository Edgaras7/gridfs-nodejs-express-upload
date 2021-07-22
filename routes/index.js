var express = require('express'); 
var testController = require('../controllers/test-controller');
var router = express.Router();
var parseForm = express.urlencoded({ extended: true });
 
 
router.get('/', testController.fileForm ); 

router.post('/upload', parseForm, testController.uploadFile );

router.get('/delete/:id', testController.deleteFile ); 

router.get('/download/:id', testController.downloadFile ); 

module.exports = router;
