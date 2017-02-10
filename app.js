'use strict';

const UPLOADED_DIR = "uploaded/";

const express = require('express');
const app = express();
const multer = require('multer');

let storage = multer.memoryStorage();

const upload = multer({
    storage: storage
});
const flow = require('./flowjs')(UPLOADED_DIR);

app.use(express.static(__dirname + '/public'));

app.post('/upload', upload.single('file'), (req, res) => {

    let file = req.file;
    let body = req.body;

    flow.upload(file, body, () => {
        res.send();
    });
});

app.listen(3000, () => {
    console.log('App listening on port 3000!')
});

app.get('/download/:identifier/:filename', function(req, res) {
    let identifier = req.params.identifier;
    let filename = req.params.filename;
    flow.download(identifier, filename, (stream) => {

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', 'application/octet-stream');
        stream.pipe(res);
    });
});
