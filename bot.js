'use latest';
import bodyParser from 'body-parser';
import express from 'express';
import request from 'request';
import Webtask from 'webtask-tools';
import { MongoClient } from 'mongodb';
import { ObjectID } from 'mongodb';

const collection = 'chatbot.terms';
const server = express();

function Term(key, value) {
  this.key = key;
  this.value = value;
}

var insertTerm = function(term, value, db, cb) {
  db.collection(collection).find().toArray((err, terms) =>  {
    if (err) cb(err);
    else {
      const existing = terms.find(o => o.key === term.toLowerCase());
      if (existing && existing._id !== null) cb(null, `Term \'${term}\' already exists`); 
      else {
        db.collection(collection).insertOne(new Term(term.toLowerCase(),value), (err, result) => {
          db.close();
          if (err) cb(err);
          else cb(null, `Added \'${term}\' with response \'${value}\'`);
        });
      }
    }
  });
};

var readTerms = function(db, cb) {
    db.collection(collection).find().toArray((err, terms) =>  {
      db.close();
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
          db.close();
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
            db.close();
            if (err) cb(err);
            else { cb(null, `Term \'${term}\' successfully deleted`); }
          });
        } else { cb(null, `${term} not found`); }
      }
  });
};

var sendToGroupMe = function(text, groupId, botId, cb) {
  request.post("https://api.groupme.com/v3/bots/post", 
    {json: {"bot_id": botId, "text": text}},
    (err, res, body) => {
      if (!err && res.statusCode >= 200 && res.statusCode < 300) {
        cb(null, `Successfully posted message \'${text}\'`);
      }
      else cb(err);
    }
  );
};

server.use(bodyParser.json());
server.get('/', (req, res, next) => {
    res.status(200).send('Hello there!');
});

// Receives callback POSTS from GroupMe service
server.post('/', (req, res, next) => {
  const { MONGO_URL, GROUPME_GROUP_ID, GROUPME_BOT_ID } = req.webtaskContext.data;
  MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) return next(err);
    // Expects GroupMe payload
    const comment = req.body.text;
    const parts = comment.split(' ');
    console.log(req.body.sender_id);
    if (req.body.sender_id === GROUPME_BOT_ID) res.status(200).send('');
    else {
    if (parts[0].toLowerCase() == '/bot') {
      switch(parts[1]) {
        case 'add':
        case 'new':
        case 'insert':
          insertTerm(parts[2], parts.slice(3, parts.length).join(' '), db, (err, result) => {
            sendToGroupMe(result, GROUPME_GROUP_ID, GROUPME_BOT_ID, (err, message) => {
              res.status(200).send(message);
            });
          });
          break;
        case 'update':
        case 'change':
          updateTerm(parts[2], parts.slice(3, parts.length).join(' '), db, (err, result) => {
            sendToGroupMe(result, GROUPME_GROUP_ID, GROUPME_BOT_ID, (err, message) => {
              res.status(200).send(message);
            });
          });
          break;
        case 'delete':
        case 'remove':
        case 'rm':
          deleteTerm(parts[2], db, (err, result) => {
            sendToGroupMe(result, GROUPME_GROUP_ID, GROUPME_BOT_ID, (err, message) => {
              res.status(200).send(message);
            });
          });
          break;
        default:
          res.status(200).send('Command not found');
      }
    } else {
      readTerms(db, (err, terms) => {
        if (err) res.status(500).send(err);
        else {
          let matches = [];
          for(var i = 0; i < terms.length; i++) {
            if (comment.indexOf(terms[i].key) > -1) matches.push(terms[i].value);
          }
          if (matches.length > 0) {
            matches.forEach(function(match){
              sendToGroupMe(match, GROUPME_GROUP_ID, GROUPME_BOT_ID, (err, message) => {
                res.status(200).send(message);
              });
            });
          } else {res.status(200).send('');}
        }
      });
    }
    }
  });
});

module.exports = Webtask.fromExpress(server);
