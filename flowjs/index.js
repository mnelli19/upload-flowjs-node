'use strict';

const fs = require('fs-extra');
fs.readdir = require('fs').readdir;
fs.open = require('fs').open;
fs.write = require('fs').write;

const path = require('path');

let upload = (uploadedDir) => {

    const UPLOADED_DIR = uploadedDir

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
    
    let writeChunk = (filename, buffer, position, callback) => {
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
    console.log("**** buffer >>>> "+buffer);
    console.log("**** position >>>> "+position);
    
    var storageClient = pkgcloud.storage.createClient(config);

    storageClient.auth(function(err) {
        if (err) {
            console.error(err);
        }
        else {
            console.log(storageClient._identity);
        }
        
    });
    
    var myFile = fs.createReadStream(filename {
            start: position
        });

        var upload = storageClient.upload({
            container: "FlowJsNode",
            remote: filename+"-"+position
        });

        upload.on('error', function(err) {
            console.log("**** ERROR >>>> ");
            console.error(err);
            callback(err);
        });

        upload.on('success', function(file) {
            console.log("**** SUCCESS >>>> ");
            console.log(file.toJSON());
            callback();
        });

        myFile.pipe(upload);
        
       
    }

    let checkChunk = (file, body, callback) => {

        let filename = body.flowFilename;
        let uploadDir = path.join(UPLOADED_DIR, body.flowIdentifier, filename);
        let position = (body.flowChunkNumber - 1) * body.flowChunkSize;

        if (fs.existsSync(uploadDir)) {
            writeChunk(uploadDir, file.buffer, position, callback);

        } else {
            var buffer = new Buffer(0);
            fs.outputFile(uploadDir, buffer, function() {
                writeChunk(uploadDir, file.buffer, position, callback);
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
