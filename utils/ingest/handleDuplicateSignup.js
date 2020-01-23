const _unset = require('lodash/unset');
const Activity = require('../../schema/Activity');
const { getTimestampFromLocalISO } = require('../../utils');
const { getSlackSuccessMessage } = require('./utils');
const { slackSuccess } = require('../slackNotification');
const refreshAthlete = require('../refreshAthlete');

/**
 * Update Athlete tokens and document in case of duplicate signup
 * See example exchange response: https://developers.strava.com/docs/authentication/
 *
 * @param {Athlete} athleteDoc
 * @param {Object} tokenExchangeResponse
 * @param {Response} res Express response
 * @param {Function} handleSignupError Error notification
 */
async function handleDuplicateSignup(
  athleteDoc,
  tokenExchangeResponse,
  res,
  handleSignupError,
) {
  const {
    id,
    firstname,
    lastname,
    profile,
  } = tokenExchangeResponse.athlete;

  try {
    // Update document and save it.
    const updateData = {
      ...tokenExchangeResponse,
      athlete: {
        id,
        firstname,
        lastname,
        profile,
      },
      status: 'ready',
    };
    _unset(updateData, 'expires_in');
    athleteDoc.set(updateData);
    athleteDoc.markModified('athlete');
    await athleteDoc.save();

    res.redirect(303, `/rider/${id}?v2&ds=1`);

    // Check new activities
    const lastActivity = await Activity.find(
      { athlete_id: athleteDoc._id },
      'start_date_local',
      {
        lean: true,
        limit: 1,
        sort: { _id: -1 },
      },
    );
    if (lastActivity.length) {
      const timestampOfLastActivity = getTimestampFromLocalISO(
        lastActivity[0].start_date_local,
      );
      await refreshAthlete(athleteDoc, timestampOfLastActivity);
    }

    // Notify success
    // @note The success message will have the allTime laps from
    // *before* the refreshAthlete() call above
    const successMessage = getSlackSuccessMessage(athleteDoc);
    console.log(`Duplicate signup: ${successMessage}`);
    slackSuccess('Duplicate signup', successMessage);
  } catch (err) {
    handleSignupError(43, {
      err,
      athlete_id: id,
    });
  }
}

module.exports = {
  handleDuplicateSignup,
};
