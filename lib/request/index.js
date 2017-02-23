'use strict';

let Cloudant = require('cloudant');
const DB_NAME = 'nodejs-upload'
const REQUEST_COLLECTION = 'request'
const FILE_COLLECTION = 'file'

let config = {
    url: "https://bee17896-df4a-4569-b79b-14ba0d2e21a2-bluemix:be6c67df3b06993c373f85126c21be362bcd165620e93cc010e5ea83b93aac34@bee17896-df4a-4569-b79b-14ba0d2e21a2-bluemix.cloudant.com",
    username: "bee17896-df4a-4569-b79b-14ba0d2e21a2-bluemix",
    password: "be6c67df3b06993c373f85126c21be362bcd165620e93cc010e5ea83b93aac34"
}


let cloudant = Cloudant(config, function(err, cloudant) {
    if (err) reply(err)
    cloudant.db.get(DB_NAME, function(err, body) {
        if (err) {
            cloudant.db.create(DB_NAME, function(err, body) {
                if (!err) {
                    console.log('database ' + DB_NAME + 'created!');
                }
            });
        }
    });
})


module.exports.insert = function(payload, callback) {
    let db = cloudant.use(DB_NAME);
    db.find({
        selector: {
            uniqueIdentifier: payload.uniqueIdentifier,
            user: payload.user
        }
    }, function(err, body) {
        if (err) callback({
            code: 500,
            msg: err
        })
        payload.status = 'PREPARING'
        if (body.docs.length === 0) {
            db.insert(payload, function(err, body) {
                if (err) callback({
                    code: 500,
                    msg: 'Something went wrong'
                })
                callback(null, {
                    msg: 'Document insert successfully'
                })
            })
        } else {
            return callback({
                code: 403,
                msg: 'Document already exists'
            })
        }
    });
}

module.exports.getFromIdAndUser = function(uniqueIdentifier, user, callback) {
    let db = cloudant.use(DB_NAME);
    db.find({
        selector: {
            uniqueIdentifier: uniqueIdentifier,
            user: user,
            status: 'CONFIRMED'
        }
    }, function(err, body) {
        if (err) callback({
            code: 500,
            msg: 'Something went wrong'
        })
        if (body.docs.length === 0) callback({
            code: 404,
            msg: 'File not found'
        })
        callback(null, body)
    });
}

module.exports.confirm = function(uniqueIdentifier, user, callback) {
  let db = cloudant.use(DB_NAME);
  db.find({
      selector: {
          uniqueIdentifier: uniqueIdentifier,
          user: user
      }
  }, function(err, body) {
      if (err) return callback({
          code: 500,
          msg: 'Something went wrong'
      })
      if (body.docs.length === 0) return callback({
          code: 404,
          msg: 'File not found'
      })

      let file = body.docs[0];
      console.log(file);
      file.status = 'CONFIRMED';

      db.insert(file, function(err, body) {
          if (err) return callback({
              code: 500,
              msg: 'Something went wrong'
          })
          return callback(null, {
              msg: 'Document update successfully'
          })
      })

  });
}
