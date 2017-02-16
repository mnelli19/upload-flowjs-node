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
 console.log("**** chiamata POST >>>> ");
    let file = req.file;
    let body = req.body;

    flow.upload(file, body, (err, result) => {
        res.send();
    });


});

app.listen(process.env.PORT || 3000, () => {
    console.log('App listening on port 3000!')
});

app.get('/download/:identifier/:filename/:number', function(req, res) {
    console.log("**** chiamata GET >>>> ");
    let identifier = req.params.identifier;
    let filename = req.params.filename;
    let number = req.params.number;
    flow.download(identifier, filename, number, (err, result) => {

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', 'application/octet-stream');
        result.pipe(res);

    });
});
