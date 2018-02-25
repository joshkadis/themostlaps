require('dotenv').config();
const querystring = require('querystring');
const mongoose = require('mongoose');
const express = require('express');
const next = require('next');

const scheduleNightlyRefresh = require('./utils/scheduleNightlyRefresh');

// Route handlers
const onAuthCallback = require('./server/onAuthCallback');
const initAPIRoutes = require('./api/initAPIRoutes');

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
        console.log(`Auth error ${authResult.error}: ${authResult.errorMsg || 'unknown error'}`);
      } else {
        redirectQuery = {
          authsuccess: 'true',
          id: authResult.athlete.id,
          firstname: authResult.athlete.firstname,
          email: authResult.athlete.email,
          allTime: authResult.athlete.allTime,
        };
      }

      const redirectTo = req.query.state ?
        decodeURIComponent(req.query.state) :
        '/';

      res.redirect(303, `${redirectTo}?${querystring.stringify(redirectQuery)}`);
    });

    /**
     * Next.js routing
     */

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
