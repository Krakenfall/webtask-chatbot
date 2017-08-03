'use latest';
import bodyParser from 'body-parser';
import express from 'express';
import Webtask from 'webtask-tools';
import { MongoClient } from 'mongodb';
import { ObjectID } from 'mongodb';

const collection = 'chatbot.terms';
const server = express();

function Term(key, value) {
  this.key = key;
  this.value = value;
}

var insertTerm = function(key, value, db, cb) {
    db.collection(collection).insertOne(new Term(key.toLowerCase(),value), (err, result) => {
      if (err) cb(err);
      cb(null, result);
    });
};

var readTerms = function(db, cb) {
    db.get().collection(collection).find().toArray((err, terms) =>  {
      if (err) cb(err);
      else cb(null, terms);
    });
};

var updateTerm = function(term, value, db, cb) {
  db.get().collection(collection).find().toArray((err, terms) =>  {
    if (err) cb(err);
    else {
      var newVal = terms.find(o => o.key === term.toLowerCase());
        if (newVal) {
        db.get().collection(collection).update({_id: newVal._id}, {$set: {value: newVal.value}}, (err, result) => {
          if (err) cb(err);
          else { cb(null, 'Term successfully updated'); }
        });	
        } else { cb(null, `${term} not found`); }
    }
  });
};

var deleteTerm = function(term, db, cb) {
  db.get().collection(collection).find().toArray((err, terms) =>  {
      if (err) cb(err);
      else {
        var doomed = terms.find(o => o.key === term.toLowerCase());
        if (doomed) {
          db.get().collection(collection).remove({_id : doomed._id}, (err, result) => {
            if (err) cb(err);
            else { cb(null, 'Term successfully deleted'); }
          });
        } else { cb(null, `${term} not found`); }
      }
  });
};




server.use(bodyParser.json());
server.get('/', (req, res, next) => {
    res.status(200).send('Hello there!');
});

// Receives callback POSTS from GroupMe service
server.put('/', (req, res, next) => {
  const { MONGO_URL } = req.webtaskContext.data;
  MongoClient.connect(MONGO_URL, (err, db) => {
    // Expects GroupMe payload
    var message = req.body.text
    var parts = message.split(' ');
    if (parts[0].toLowerCase() == '/bot') {
      switch(parts[1]) {
        case 'add':
        case 'new':
          insertTerm(parts[2], parts.splice(0, 3), db, (err, result) => {
            res.status(200).send(result);
          });
          break;
        case 'update':
        case 'change':
          break;
        default:
          res.status(200).send('Command not found');
      }
    }
  });  

});

module.exports = Webtask.fromExpress(server);
