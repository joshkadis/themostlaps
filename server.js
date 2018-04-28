require('dotenv').config();
const querystring = require('querystring');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const next = require('next');

const Athlete = require('./schema/Athlete');

// Route handlers
const handleSignupCallback = require('./server/handleSignupCallback');
const handleNotification = require('./server/handleNotification');
const initAPIRoutes = require('./api/initAPIRoutes');
const initWebhookRoutes = require('./utils/initWebhookRoutes');
const getRankingParams = require('./utils/getRankingParams');
const { slackError } = require('./utils/slackNotification');

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
    server.get(/^\/ranking\/(allTime|single|[\d]{4,4})?\/?(\d{2,2})?$/, (req, res) => {
      const params = getRankingParams(req.params);
      if (!params.type) {
        res.statusCode = 404;
        app.render(req, res, '/_error', {});
      } else {
        app.render(req, res, '/ranking', Object.assign(req.query, params));
      }
    });

    server.get(/^\/rider\/(\d+)$/, async (req, res) => {
      const athleteId = parseInt(req.params[0], 10);
      let athleteExists = true;
      if (!isNaN(athleteId)) {
        athleteExists = await Athlete.findById(athleteId);
        athleteExists = !!athleteExists;
      } else {
        athleteExists = false;
      }

      if (!athleteExists) {
        res.statusCode = 404;
        app.render(req, res, '/_error', {});
      } else {
        app.render(req, res, '/rider', Object.assign(req.query, { athleteId }));
      }
    });

    server.get(/^\/(terms|privacy|about)$/, (req, res) => {
      app.render(req, res, '/page', Object.assign(req.query, { pageName: req.params[0] }));
    })

    server.get('/notifications/:encrypted', async (req, res) => {
      const success = await handleNotification(req.params.encrypted, res);
      app.render(req, res, '/notifications', Object.assign({...req.query}, { success } ));
    });

    /**
     * Webhook routes
     */
    initWebhookRoutes(server);

    /**
     * API routing
     */
    initAPIRoutes(server);

    /**
     * Catchall handler
     */
    server.get('*', (req, res) => {
      return handle(req, res)
    })

    /**
     * Connect to database and start listening
     */
    mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection;
    db.once('open', () => {
      console.log('Connected to database');
      server.listen(process.env.PORT, () => {
        console.log(`App listening on port ${process.env.PORT}`);
        // @todo Schedule cron tasks
      });
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
