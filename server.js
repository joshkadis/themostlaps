require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const next = require('next');

const Athlete = require('./schema/Athlete');
const { scheduleNightlyRefresh } = require('./utils/scheduleNightlyRefresh');
const { defaultLocation } = require('./config');
const { mongooseConnectionOptions } = require('./config/mongodb');
const { initSentry } = require('./utils/v2/services/sentry');
const { initializeActivityQueue } = require('./utils/v2/activityQueue');

// Route handlers
const handleSignupCallback = require('./server/handleSignupCallback');
const initApiRoutes = require('./server/initApiRoutes');
const initWebhookRoutes = require('./server/initWebhookRoutes');
const handleRankingRoute = require('./server/ranking');
// Services
initSentry();

// Next.js setup
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

/**
 * Handing routes here instead of automatically through Next
 * because we need to account for both
 * Next frontend and non-Next backend/API routes
 */
app.prepare()
  .then(() => {
    const server = express();
    server.use(bodyParser.json());

    /**
     * Auth callback, ingest and redirect
     */
    server.get('/auth-callback', async (req, res) => {
      handleSignupCallback(req, res);
    });

    /**
     * Next.js routing
     */
    handleRankingRoute(server, app.render);

    server.get('/rider/:athleteId(\\d+)/:currentLocation?', async (req, res) => {
      const athleteId = parseInt(req.params.athleteId, 10);
      const athleteDoc = await Athlete.findById(athleteId);
      if (!athleteDoc) {
        res.statusCode = 404;
        app.render(req, res, '/_error', {});
        return;
      }

      const pagePath = athleteDoc.stats_version === 'v2'
        ? '/rider_v2'
        : '/rider';
      const context = {
        ...req.query,
        athleteId,
        currentLocation: req.params.currentLocation || defaultLocation,
      };

      app.render(req, res, pagePath, context);
    });

    server.get(/^\/(terms|privacy|about)$/, (req, res) => {
      app.render(req, res, '/page', {
        ...req.query,
        pageName: req.params[0],
      });
    });

    /**
     * Webhook routes
     */
    initWebhookRoutes(server);

    /**
     * API routing
     */
    initApiRoutes(server);

    /**
     * Catchall handler
     */
    server.get('*', (req, res) => handle(req, res));

    /**
     * Connect to database and start listening
     */
    console.log(`Connecting to MONGODB_URI: ${process.env.MONGODB_URI}`);
    mongoose.connect(process.env.MONGODB_URI, mongooseConnectionOptions);
    const db = mongoose.connection;
    db.once('open', () => {
      console.log(`Connected to database: ${db.name}`);
      server.listen(process.env.PORT, () => {
        console.log(`App listening on port ${process.env.PORT}`);
        if (!process.env.DISABLE_NIGHTLY_REFRESH) {
          scheduleNightlyRefresh();
        }
        initializeActivityQueue();
      });
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
