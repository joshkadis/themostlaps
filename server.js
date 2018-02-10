require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const { prodDomain } = require('./config');

// Route handlers
const onAuthCallback = require('./server/onAuthCallback');
const renderApp = require('./server/renderApp');
const showRiderData = require('./server/showRiderData');

// API getters
const getRanking = require('./api/getRanking');

/* Express Setup */
const app = express();

app.get('/', renderApp);
app.get('/auth-callback', onAuthCallback);
app.get('/by/:id', showRiderData);

/**
 * API routing
 */
app.get('/api/ranking/:type/:segmentId', async (req, res) => {
  if ((req.hostname === 'localhost' && process.env.ALLOW_LOCALHOST !== 'true') ||
    (req.hostname !== prodDomain && req.hostname !== 'localhost')
  ) {
    res.status(403).json({ error: `Host ${req.hostname} not allowed to make API requests` });
    return;
  }

  if (!req.query.key || req.query.key !== process.env.API_KEY) {
    res.status(403).json({ error: 'Missing or invalid API key' });
    return;
  }

  const responseData = await getRanking(
    req.params.type,
    parseInt(req.params.segmentId, 10),
    req.query.filter
  );
  const status = responseData.error ? 500 : 200;
  res.status(status).json(responseData.error ? responseData : responseData.data);
});

console.log('Connecting to database');
mongoose.connect(process.env.MONGODB_URI);
app.listen(process.env.PORT,
  () => console.log(`App listening on port ${process.env.PORT}`));
