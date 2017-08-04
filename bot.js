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
      cb(null, `Added \'${key}\' with response \'${value}\'`);
    });
};

var readTerms = function(db, cb) {
    db.collection(collection).find().toArray((err, terms) =>  {
      if (err) cb(err);
      else cb(null, terms);
    });
};

var updateTerm = function(term, value, db, cb) {
  db.collection(collection).find().toArray((err, terms) =>  {
    if (err) cb(err);
    else {
      var existing = terms.find(o => o.key === term.toLowerCase());
        if (existing && existing._id !== null) {
        db.collection(collection).updateOne({_id: existing._id}, {key: term.toLowerCase(), value: value}, (err, result) => {
          if (err) cb(err);
          else { cb(null, `Updated \'${term}\' with value \'${value}\'`); }
        });	
        } else { cb(null, `${term} not found`); }
    }
  });
};

var deleteTerm = function(term, db, cb) {
  db.collection(collection).find().toArray((err, terms) =>  {
      if (err) cb(err);
      else {
        var doomed = terms.find(o => o.key === term.toLowerCase());
        if (doomed) {
          db.collection(collection).remove({_id : doomed._id}, (err, result) => {
            if (err) cb(err);
            else { cb(null, `Term \'${term}\' successfully deleted`); }
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
server.post('/', (req, res, next) => {
  const { MONGO_URL } = req.webtaskContext.data;
  MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) return next(err);
    // Expects GroupMe payload
    var message = req.body.text;
    var parts = message.split(' ');
    if (parts[0].toLowerCase() == '/bot') {
      switch(parts[1]) {
        case 'add':
        case 'new':
        case 'insert':
          insertTerm(parts[2], parts.slice(3, parts.length).join(' '), db, (err, result) => {
            res.status(200).send(result);
          });
          break;
        case 'update':
        case 'change':
          updateTerm(parts[2], parts.slice(3, parts.length).join(' '), db, (err, result) => {
            res.status(200).send(result);
          });
          break;
        case 'delete':
        case 'remove':
        case 'rm':
          deleteTerm(parts[2], db, (err, result) => {
            res.status(200).send(result);
          });
          break;
        default:
          res.status(200).send('Command not found');
      }
    } else {
      readTerms(db, (err, terms) => {
        if (err) res.status(500).send(err);
        else {
          var matches = [];
          for(var i = 0; i < terms.length; i++) {
            if (message.indexOf(terms[i].key) > -1) matches.push(terms[i].value);
          }
          if (matches.length > 0) res.status(200).send(`Matches: ${matches.join(", ")}`);
          else res.status(200).send('');
        }
      });
    }
  });  

});

module.exports = Webtask.fromExpress(server);
