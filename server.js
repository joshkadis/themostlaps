require('dotenv').config();
const querystring = require('querystring');
const mongoose = require('mongoose');
const express = require('express');
const next = require('next');

const scheduleNightlyRefresh = require('./utils/scheduleNightlyRefresh');
const subscribeToMailingList = require('./utils/subscribeToMailingList');
const Athlete = require('./schema/Athlete');

// Route handlers
const onAuthCallback = require('./server/onAuthCallback');
const handleNotification = require('./server/handleNotification');
const initAPIRoutes = require('./api/initAPIRoutes');
const getRankingParams = require('./utils/getRankingParams');
const { slackError } = require('./utils/slackNotification');

// Next.js setup
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {

    const server = express();

    /**
     * Auth callback, ingest and redirect
     */
    server.get('/auth-callback', async (req, res) => {
      const authResult = await onAuthCallback(req, res);

      let redirectQuery;
      if (authResult.error || !authResult.athlete) {
        redirectQuery = {
          autherror: authResult.error || 99
        };
        console.log(authResult);
        const errorInfo = authResult.athlete && authResult.athlete.id ?
          `Athlete id ${authResult.athlete.id}, ${authResult.athlete.email || 'email unknown'}` :
          false;

        slackError(authResult.error, errorInfo);
      } else {
        redirectQuery = {
          authsuccess: 'true',
          firstname: authResult.athlete.firstname,
          allTime: authResult.athlete.allTime,
          id: authResult.athlete.id,
        };
      }

      const stateParam = req.query.state ?
        decodeURIComponent(req.query.state).split('|') :
        ['/'];

      if (redirectQuery.authsuccess) {
        subscribeToMailingList(
          authResult.athlete.email,
          (stateParam.length > 1 && stateParam[1] === 'shouldSubscribe') // Add to newsletter segment?
        );
      }

      res.redirect(303, `${stateParam[0]}?${querystring.stringify(redirectQuery)}`);
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

    server.get('/notifications/:cipher', async ({ params }, res) => {
      await handleNotification(params.cipher, res);
    });

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
        scheduleNightlyRefresh();
      });
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
