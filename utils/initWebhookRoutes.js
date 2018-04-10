const { slackError, slackSuccess } = require('./slackNotification');
const refreshAthleteFromActivity = require('./refreshAthlete/refreshAthleteFromActivity');
const { testAthleteIds } = require('../config');

/**
 * See https://developers.strava.com/docs/webhooks/
 */

/**
 * Validate subscription callback via GET
 *
 * @param {Request} req
 * @param {Response} res
 */
function validateSubscription(req, res) {
  const { headers, params, query, url, method } = req;
  console.log({ headers, params, query, url, method });

  if (
    'string' !== typeof query['hub.mode'] ||
    'subscribe' !== query['hub.mode'] ||
    'string' !== typeof query['hub.verify_token'] ||
    'string' !== typeof query['hub.challenge']
  ) {
    res.statusCode = 401;
    res.send('malformed validation query')
    return;
  }

  if ('STRAVA' !== query['hub.verify_token']) {
    res.statusCode = 401;
    res.send(`incorrect verify_token: ${query['hub.verify_token']}`)
    return;
  }

  res.json({ 'hub.challenge': query['hub.challenge'] });
  slackSuccess(`Validated callback subscription for ${query['hub.verify_token']}`);
}

/**
 * Handle webhook event
 *
 * @param {Request} req
 * @param {Response} res
 */
async function handleEvent(req, res) {
  res.send('ok');
  try {
    const {
      aspect_type,
      object_id,
      owner_id,
    } = req.body;

    if (-1 === testAthleteIds.indexOf(owner_id)) {
      return;
    }

    if ('create' === aspect_type) {
      const activityLaps = await refreshAthleteFromActivity(owner_id, object_id);
      slackSuccess(`New activity ${object_id} by athlete ${owner_id} has ${activityLaps} laps`);
    }
  } catch (err) {
    slackError(110, JSON.stringify(req.body, null, 2));
  }
}

/**
 * Routing for Strava webhooks
 *
 * @param {Server} server
 */
function initWebhookRoutes(server) {
  server.post('/webhooks/strava', handleEvent);
  server.get('/webhooks/strava', validateSubscription);
}

module.exports = initWebhookRoutes;
