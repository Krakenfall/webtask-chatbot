'use latest';
import bodyParser from 'body-parser';
import express from 'express';
import Webtask from 'webtask-tools';
import { MongoClient } from 'mongodb';
import { ObjectID } from 'mongodb';

const collection = 'chatbot.terms';
const server = express();


server.use(bodyParser.json());
server.get('/', (req, res, next) => {
    res.status(200).send('Hello there!');
});

server.post('/', (req, res, next) => {
  return next('Err: Not Ready');
});
module.exports = Webtask.fromExpress(server);
