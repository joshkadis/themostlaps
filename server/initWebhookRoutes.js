const { slackSuccess } = require('../utils/slackNotification');
const { removeAthlete } = require('../utils/athleteUtils');
const refreshAthleteProfile = require('../utils/refreshAthlete/refreshAthleteProfile');
const { handleActivityWebhook } = require('../utils/v2/activityQueue');
const { captureSentry } = require('../utils/v2/services/sentry');
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
  const {
    headers,
    params,
    query,
    url,
    method,
  } = req;

  console.log({
    headers,
    params,
    query,
    url,
    method,
  });

  if (
    typeof query['hub.mode'] !== 'string'
    || query['hub.mode'] !== 'subscribe'
    || typeof query['hub.verify_token'] !== 'string'
    || typeof query['hub.challenge'] !== 'string'
  ) {
    res.statusCode = 401;
    res.send('malformed validation query');
    return;
  }

  if (query['hub.verify_token'] !== 'STRAVA') {
    res.statusCode = 401;
    res.send(`incorrect verify_token: ${query['hub.verify_token']}`);
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
      object_type,
      owner_id,
      updates = {},
    } = req.body;

    console.log(`Received webhook: ${aspect_type} | ${object_type} | ${object_id} | ${owner_id}`);

    if (object_type === 'activity') {
      await handleActivityWebhook(req.body);
    }

    if (object_type === 'athlete') {
      if (updates.authorized === false) {
        await removeAthlete(owner_id, ['any']);
        slackSuccess('Athlete deauthorized', { owner_id });
        captureSentry('Athlete deauthorized', 'webhook', {
          level: 'info',
          extra: { owner_id },
        });
      } else {
        // Strava currently sends athlete webhooks only for deauthorization
        // but you never know...
        await refreshAthleteProfile(owner_id);
        captureSentry('Unknown athlete update', 'webhook', {
          level: 'info',
          extra: req.body,
        });
      }
    }
  } catch (err) {
    captureSentry(err, 'webhook', {
      extra: req.body,
    });
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
