const { slackError, slackSuccess } = require('./slackNotification');
const refreshAthleteFromActivity = require('./refreshAthlete/refreshAthleteFromActivity');

const REFRESH_DELAY = 15 * 60 * 1000; // 15min delay

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
 * Delay refresh after activity webhook to account for
 * delay until segment efforts are ready
 *
 * @param {Integer} athleteId
 * @param {Integer} activityId
 */
async function scheduleActivityRefresh(athleteId, activityId) {
  const receivedAtTime = new Date().toISOString();
  setTimeout(
    async () => {
      console.log(`Refreshing: Athlete ${athleteId} | Activity ${activityId} | Received at ${receivedAtTime}`);
      await refreshAthleteFromActivity(
        athleteId,
        activityId,
        !process.env.DISABLE_REFRESH_FROM_WEBHOOK,
      );
    },
    REFRESH_DELAY,
  );
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
    } = req.body;

    console.log(`Received webhook: ${aspect_type} | ${object_type} | ${object_id} | ${owner_id}`);

    if (object_type === 'athlete') {
      slackSuccess('Received athlete webhook', req.body);
    } else if (aspect_type === 'create') {
      await scheduleActivityRefresh(owner_id, object_id);
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
