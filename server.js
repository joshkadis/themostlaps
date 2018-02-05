require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');

// Route handlers
const handleAuthCallback = require('./server/handleAuthCallback');
const renderApp = require('./server/renderApp');
const showRiderData = require('./server/showRiderData');

/* Express Setup */
const app = express();

app.get('/', renderApp);
app.get('/auth-callback', handleAuthCallback);
app.get('/by/:id', showRiderData);

const port = 'production' === process.env.NODE_ENV ? 8080 : 3000;

console.log('Connecting to database');
mongoose.connect(process.env.DB_URL);
app.listen(port, () => console.log(`Example app listening on port ${port}`));
