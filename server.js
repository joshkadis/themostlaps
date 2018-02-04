require('dotenv').config()
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const handleAuthCallback = require('./server/handleAuthCallback');
const renderApp = require('./server/renderApp');

/* Express Setup */
const app = express();

app.get('/', renderApp);
app.get('/auth-callback', handleAuthCallback)

const port = 'production' === process.env.NODE_ENV ? 8080 : 3000;

app.listen(port, () => console.log(`Example app listening on port ${port}`));


/* Mongo Setup */

// MongoClient.connect(process.env.DB_URL, function(err, client) {
//   assert.equal(null, err);
//   console.log("Connected successfully to server");

//   const db = client.db(process.env.DB_NAME);
//   db.createCollection('tml_users', () => {
//     console.log('created tml_users');
//   });
// });
