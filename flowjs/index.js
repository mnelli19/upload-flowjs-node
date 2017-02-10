'use strict';

const fs = require('fs-extra');
fs.readdir = require('fs').readdir;
fs.open = require('fs').open;
fs.write = require('fs').write;

const path = require('path');

let upload = (uploadedDir) => {

    const UPLOADED_DIR = uploadedDir

    let writeChunk = (filename, buffer, position, callback) => {
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
