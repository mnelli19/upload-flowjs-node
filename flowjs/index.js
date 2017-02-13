'use strict';

const fs = require('fs-extra');
fs.readdir = require('fs').readdir;
fs.open = require('fs').open;
fs.write = require('fs').write;

const path = require('path');
var pkgcloud = require('pkgcloud');
//var ObjectStorage = require('bluemix-object-storage');
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

let upload = (uploadedDir) => {

    const UPLOADED_DIR = uploadedDir

    let writeChunk = (filename, file, position, chunkSize, callback) => {
    	console.log("**** writeChunk >>>> ");
        /*
        let writer = fs.createWriteStream(filename, {
            flags: 'r+',
            autoClose: true,
            start: position
        });
        writer.write(buffer);
        writer.end();

        writer.on('finish', () => {
            callback();
        });
        writer.on('error', (err) => {
            callback(err);
        });
        */


    //modifica bluemix ///
    console.log("**** filename >>>> "+filename);
    //console.log("**** buffer >>>> "+buffer);
    console.log("**** position >>>> "+position);
    console.log("**** chuknksize >>>>"+chunkSize);

    var storageClient = pkgcloud.storage.createClient(config);

    storageClient.auth(function(err) {
        if (err) {
            console.error(err);
        }
        else {
            console.log(storageClient._identity);
        }

    });

    // TO-DO - creare un readable stream con il buffer
    var myFile = fs.createReadStream(file.originalname);

    //var myFile = fs.createReadStream(buffer);

        var uploadstorage = storageClient.upload({
            container: "FlowJsNode",
            remote: file.originalname+"-"+position
        });

        uploadstorage.on('error', function(err) {
            console.log("**** ERROR >>>> ");
            console.error(err);
            callback(err);
        });

        uploadstorage.on('success', function(file) {
            console.log("**** SUCCESS >>>> ");
            console.log(file.toJSON());
            callback();
        });

        myFile.pipe(uploadstorage);



//    var os = new ObjectStorage(
//      'admin_9757dce54df22d39aebe60045e8949690d5ad7fe',
//      'p?v.}M2N*1nQ6YQ(',
//      '80e33159813f48739f09570464e566c4',
//      'FlowJsNode',
//      'https://identity.open.softlayer.com');

//        os.createContainer()
//        .then(function(){
//          return os.setContainerPublicReadable();
//        })
//        .then(function(){
//          return os.uploadFileToContainer(filename, 'image/jpeg', buffer, chunkSize);
//        });
//       	.then(function(file){
//          console.log('url to uploaded file:', file);
//          return os.listContainerFiles();
//        })
//        .then(function(files){
//          console.log('list of files in container:', files);
//        });

        
 }
    let checkChunk = (file, body, callback) => {
    	console.log("**** chechChunk >>>> ");
        let filename = body.flowFilename;
        let uploadDir = path.join(UPLOADED_DIR, body.flowIdentifier, filename);
        let position = (body.flowChunkNumber - 1) * body.flowChunkSize;
        let chunkSize = body.flowChunkSize;


        if (fs.existsSync(uploadDir)) {
            writeChunk(uploadDir, file, position,chunkSize, callback);

        } else {
            var buffer = new Buffer(0);
            fs.outputFile(uploadDir, buffer, function() {
                writeChunk(uploadDir, file, position,chunkSize, callback);
            });
        }
    }

    return {
        upload: (file, body, callback) => {
            checkChunk(file, body, callback);
        },
        download: (identifier, filename, callback) => {
            let stream = fs.createReadStream(path.join(UPLOADED_DIR, identifier, filename));
            callback(stream);
        }
    }

}

module.exports = upload;
