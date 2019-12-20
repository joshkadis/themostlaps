const { slackError, slackSuccess } = require('../utils/slackNotification');
const refreshAthleteFromActivity = require('../utils/refreshAthlete/refreshAthleteFromActivity');
const { removeAthlete } = require('../utils/athleteUtils');
const refreshAthleteProfile = require('../utils/refreshAthlete/refreshAthleteProfile');
const { isLocalEnv } = require('../utils/envUtils');
const { handleActivityWebhook } = require('../utils/v2/activityQueue');

const ACTIVITY_WEBHOOK_DELAY = isLocalEnv()
  ? 10000 // 10s for local dev
  : 15 * 60 * 1000; // 15min delay everywhere else

const MAX_ACTIVITY_ATTEMPTS = 4;

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
  let attemptNumber = 0;
  const activityRefresh = setInterval(
    async () => {
      attemptNumber += 1;
      console.log(`Processing: Athlete ${athleteId} | Activity ${activityId} | Received at ${receivedAtTime} | Attempt ${attemptNumber}`);
      const processCompleted = await refreshAthleteFromActivity(
        athleteId,
        activityId,
        !process.env.DISABLE_REFRESH_FROM_WEBHOOK,
      );
      if (processCompleted) {
        clearInterval(activityRefresh);
      } else if (attemptNumber >= MAX_ACTIVITY_ATTEMPTS) {
        console.log(`Failed to process activity ${activityId} after ${attemptNumber} attempts`);
        clearInterval(activityRefresh);
      }
    },
    ACTIVITY_WEBHOOK_DELAY,
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
      updates = {},
    } = req.body;

    console.log(`Received webhook: ${aspect_type} | ${object_type} | ${object_id} | ${owner_id}`);

    /*
      Currently testing
    */
    if (object_type === 'activity') {
      handleActivityWebhook(req.body);
    }

    if (object_type === 'athlete') {
      slackSuccess('Received athlete webhook', req.body);
      if (updates.authorized === false) {
        await removeAthlete(owner_id, ['any']);
      } else {
        // Strava currently sends athlete webhooks only for deauthorization
        // but you never know...
        await refreshAthleteProfile(owner_id);
      }
    } else if (aspect_type === 'create' && object_type === 'activity') {
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
