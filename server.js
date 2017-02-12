'use strict';

const UPLOADED_DIR = "uploaded/";

const express = require('express');
const app = express();
const multer = require('multer');


//bluemix file storage modificato
var pkgcloud = require('pkgcloud');

var config = {
    provider: 'openstack',
    useServiceCatalog: true,
    useInternal: false,
    keystoneAuthVersion: 'v3',
    authUrl: 'https://identity.open.softlayer.com',
    tenantId: '80e33159813f48739f09570464e566c4',    //projectId from credentials
    domainId: '5c97167852de417884764ac2ae2c25ca',
    username: 'admin_9757dce54df22d39aebe60045e8949690d5ad7fe',
    password: 'p?v.}M2N*1nQ6YQ(',
    region: 'dallas'   //dallas or london region
};
// end bluemix ///

let storage = multer.memoryStorage();

const upload = multer({
    storage: storage
});
const flow = require('./flowjs')(UPLOADED_DIR);

app.use(express.static(__dirname + '/public'));

app.post('/upload', upload.single('file'), (req, res) => {
 console.log("**** chiamata POST >>>> ");
    let file = req.file; //modificato
    let body = req.body;

    //modifica bluemix ///
    console.log("**** file req >>>> "+req.file);
    console.log("**** identifier >>>> "+req.identifier);
    console.log("**** file >>>> "+req.filename);
    //console.log("**** body >>>> "+body);
    console.log("**** req filename >>>> "+req.filename);
    
    var storageClient = pkgcloud.storage.createClient(config);

    storageClient.auth(function(err) {
        if (err) {
            console.error(err);
        }
        else {
            console.log(storageClient._identity);
        }
        
    });
    
    var myFile = fs.createReadStream(req.file);

        var upload = storageClient.upload({
            container: "FlowJsNode",
            remote: file
        });

        upload.on('error', function(err) {
            console.log("**** ERROR >>>> ");
            console.error(err);
            res.send();
        });

        upload.on('success', function(file) {
            console.log("**** SUCCESS >>>> ");
            console.log(file.toJSON());
            res.send();
        });

        myFile.pipe(upload);
        
         
// end bluemix ///
   
 /* modificato
    flow.upload(file, body, () => {
        res.send();
    });
    */
         
});

app.listen(process.env.PORT || 3000, () => {
    console.log('App listening on port 3000!')
});

app.get('/download/:identifier/:filename', function(req, res) {
    console.log("**** chiamata GET >>>> ");
    let identifier = req.params.identifier;
    let filename = req.params.filename;
    flow.download(identifier, filename, (stream) => {

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', 'application/octet-stream');
        stream.pipe(res);
    });
});
