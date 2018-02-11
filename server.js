require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const next = require('next');

// Route handlers
const onAuthCallback = require('./server/onAuthCallback');
const renderApp = require('./server/renderApp');
const showRiderData = require('./server/showRiderData');

// API getters
const validateApiRequest = require('./api/validateApiRequest');
const getRanking = require('./api/getRanking');

/* Next.js Setup */
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {

    const server = express();

    /**
     * Basic routing
     */
    server.get('/', renderApp);
    server.get('/auth-callback', onAuthCallback);
    server.get('/by/:id', showRiderData);

    /**
     * Next.js routing
     */
    server.get('/prospectpark', (req, res) => {
      const { lapSegmentId } = require('./config');
      app.render(req, res, '/park', { segment: lapSegmentId });
    });

    /**
     * API routing
     */
    server.get('/api/ranking/:type/:segmentId', async (req, res) => {
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

    /**
     * Catchall handler
     */
    server.get('*', (req, res) => {
      return handle(req, res)
    })

    /**
     * Connect to database and start listening
     */
    console.log('Connecting to database');
    mongoose.connect(process.env.MONGODB_URI);
    server.listen(process.env.PORT,
      () => console.log(`App listening on port ${process.env.PORT}`));
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
