require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');

// Route handlers
const onAuthCallback = require('./server/onAuthCallback');
const renderApp = require('./server/renderApp');
const showRiderData = require('./server/showRiderData');

// API getters
const validateApiRequest = require('./api/validateApiRequest');
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
  const validation = validateApiRequest(req.hostname, req.query.key || null);
  if (validation.error) {
    res.status(403).json(error);
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
