'use strict';

const express = require('express');
const multer = require('multer');
const CombinedStream = require('combined-stream');
const bodyParser = require('body-parser');
const flow = require('./lib/flowjs')();
const request = require('./lib/request');
const MAX_DATA_SIZE = 2 * 1024 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage()
});

const app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.post('/prepare', (req, res) => {
    let body = req.body;
    request.insert(body, (err, body) => {
        if (err) {
            res.status(err.code).json({message: err.msg}).end();
        }else{
            res.status(200).json({
                message: body.msg
            }).end();
        }
    })
});

app.post('/upload', upload.single('file'), (req, res) => {
    let file = req.file;
    let body = req.body;

    console.log(body);

    flow.upload(file, body, (err, result) => {
        if(err) {
            res.status(500).end();
        }else{
            res.send();
        }
    });
});

app.put('/confirm', (req, res) => {
    let body = req.body;
    let uniqueIdentifier = body.identifier;
    let user = body.user;
    request.confirm(uniqueIdentifier, user, (err, body) => {
        if (err) {
            res.status(err.code).json({message: err.msg}).end();
        }else{
            res.status(200).json({
                message: body.msg
            }).end();
        }
    })
});

app.get('/download/:identifier/user/:user', function(req, res) {
    let identifier = req.params.identifier;
    let user = req.params.user;

    request.getFromIdAndUser(identifier, user, (err, body) => {
        if (err){
            res.status(err.code).json(err.msg).end();
        }else{
            let filename = body.docs[0].name;
            let size = body.docs[0].size;
            flow.download(identifier, filename, size, user, (err, streams) => {

                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                res.setHeader('Content-type', 'application/octet-stream');

                let combinedStream = CombinedStream.create({
                    maxDataSize: MAX_DATA_SIZE
                });

                for (let stream of streams) {
                    combinedStream.append(stream);
                }
                combinedStream.pipe(res);
            });
        }

    })

});

app.listen(process.env.PORT || 3000, () => {
    console.log('App listening on port 3000!')
});
