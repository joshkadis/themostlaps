require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');

// Route handlers
const onAuthCallback = require('./server/onAuthCallback');
const renderApp = require('./server/renderApp');
const showRiderData = require('./server/showRiderData');

/* Express Setup */
const app = express();

app.get('/', renderApp);
app.get('/auth-callback', onAuthCallback);
app.get('/by/:id', showRiderData);

console.log('Connecting to database');
mongoose.connect(process.env.MONGODB_URI);
app.listen(process.env.PORT,
  () => console.log(`App listening on port ${process.env.PORT}`));
