'use strict';

const fs = require('fs-extra');
fs.readdir = require('fs').readdir;
fs.open = require('fs').open;
fs.write = require('fs').write;
const Readable = require('stream').Readable;
const util = require('util');
const PassThrough = require('stream').PassThrough;
const path = require('path');
var pkgcloud = require('pkgcloud');

let StreamCombiner = function() {
  this.streams = arguments[0];

  this.on('pipe', function(source) {
    source.unpipe(this);
    for(let i in this.streams) {
      console.log("Sto leggendo il "+i+" stream...");
      source = source.pipe(this.streams[i]);
    }
    this.transformStream = source;
  });
};

util.inherits(StreamCombiner, PassThrough);

StreamCombiner.prototype.pipe = function(dest, options) {
  return this.transformStream.pipe(dest, options);
};

var config = {
    provider: 'openstack',
    useServiceCatalog: true,
    useInternal: false,
    keystoneAuthVersion: 'v3',
    authUrl: 'https://identity.open.softlayer.com',
    tenantId: '80e33159813f48739f09570464e566c4', //projectId from credentials
    domainId: '5c97167852de417884764ac2ae2c25ca',
    username: 'admin_9757dce54df22d39aebe60045e8949690d5ad7fe',
    password: 'p?v.}M2N*1nQ6YQ(',
    region: 'dallas' //dallas or london region
};

const storageClient = pkgcloud.storage.createClient(config);
const CONTAINER_NAME = 'my-container';

let upload = (uploadedDir) => {

    const UPLOADED_DIR = uploadedDir

    let uploadChunk = (file, name, callback) => {
        let stream = new Readable()
        stream.push(file.buffer);
        stream.push(null);


        storageClient.createContainer({
            name: CONTAINER_NAME

        }, function(err, container) {
            if (err) return callback(err);

            let upload = storageClient.upload({
                container: container.name,
                remote: name
            });

            upload.on('error', function(err) {
                console.error(err);
            });

            upload.on('success', function(file) {
                console.log(file.toJSON());
                callback(null, "OK");
            });

            stream.pipe(upload);

        });

    }

    return {
        upload: (file, body, callback) => {
            let name = body.flowFilename + "." + body.flowChunkNumber;
            uploadChunk(file, name, callback)
        },
        download: (identifier, filename, number, callback) => {

            let merge2 = require('merge2');


            let range = Array.from({
                length: number
            }, (_, i) => i + 1);

            let streams = range.map((elem) => {
                let stream = storageClient.download({
                    container: CONTAINER_NAME,
                    remote: filename + "." + elem
                })
                return stream;
            });

            let result = merge2(streams)

            result.on('queueDrain', function() {
              console.log("queueDrain ...");
              return callback(null, result);
            })

        }
    }

}

module.exports = upload;
