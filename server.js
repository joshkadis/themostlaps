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

// Route handlers
const handleSignupCallback = require('./server/handleSignupCallback');
const handleNotification = require('./server/handleNotification');
const initApiRoutes = require('./server/initApiRoutes');
const initWebhookRoutes = require('./server/initWebhookRoutes');
const getRankingParams = require('./utils/getRankingParams');

// Services
initSentry();

// Next.js setup
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

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
    server.get(/^\/ranking\/(giro2018|cold2019)$/, (req, res) => {
      app.render(req, res, '/ranking', {
        ...req.query,
        type: 'special',
        filter: req.params[0],
      });
    });

    server.get(/^\/ranking\/(allTime|single|[\d]{4,4})?\/?(\d{2,2})?$/, (req, res) => {
      const params = getRankingParams(req.params);
      if (!params.type) {
        res.statusCode = 404;
        app.render(req, res, '/_error', {});
      } else {
        app.render(req, res, '/ranking', {
          ...req.query,
          params,
        });
      }
    });

    server.get('/rider/:athleteId(\\d+)/:location?', async (req, res) => {
      const athleteId = parseInt(req.params.athleteId, 10);
      const athleteExists = await Athlete.exists({ _id: athleteId });
      if (!athleteExists) {
        res.statusCode = 404;
        app.render(req, res, '/_error', {});
        return;
      }

      const queryIsV2 = typeof req.query.v2 !== 'undefined';
      const pagePath = queryIsV2 ? '/rider_v2' : '/rider';
      const context = {
        ...req.query,
        athleteId,
      };

      if (queryIsV2) {
        context.location = req.params.location || defaultLocation;
      }

      app.render(req, res, pagePath, context);
    });

    server.get(/^\/(terms|privacy|about)$/, (req, res) => {
      app.render(req, res, '/page', {
        ...req.query,
        pageName: req.params[0],
      });
    });

    server.get('/notifications/:encrypted', async (req, res) => {
      const success = await handleNotification(req.params.encrypted, res);
      app.render(req, res, '/notifications', {
        ...req.query,
        success,
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
      });
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
