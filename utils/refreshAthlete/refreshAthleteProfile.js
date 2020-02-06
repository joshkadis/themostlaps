const Athlete = require('../../schema/Athlete');
const fetchStravaAPI = require('../fetchStravaAPI');
const { captureSentry } = require('../v2/services/sentry');

/**
 * Update athlete profile data
 *
 * @param {Number|Document} athlete
 * @return {Document|null} Updated document or null if no athlete found
 */
async function refreshAthleteProfile(athlete) {
  const athleteDoc = typeof athlete === 'number'
    ? await Athlete.findById(athlete)
    : athlete;

  if (!athleteDoc) {
    console.log(`Could not find athlete ${athlete} in db`);
    return null;
  }

  if (athleteDoc.get('status') === 'deauthorized') {
    const {
      athlete: { firstname, lastname },
      _id,
    } = athleteDoc.toJSON();
    console.log(`${firstname} ${lastname} (${_id}) is already deauthorized`);
    return null;
  }

  // @note Removed email after Strava API change, Jan 2019
  // @note Use new token refresh logic
  try {
    const athleteResult = await fetchStravaAPI('/athlete/', athleteDoc);
    if (!athleteResult || !Object.keys(athleteResult).length) {
      return null;
    }

    const { firstname, lastname, profile } = athleteResult;

    console.log(`Updating ${firstname} ${lastname} (${athleteDoc.get('_id')})`);

    const currentDate = new Date();
    athleteDoc.set({
      athlete: {
        firstname,
        lastname,
        profile,
      },
      last_updated: currentDate.toISOString(),
    });

    return await athleteDoc.save();
  } catch (err) {
    captureSentry(err, 'refreshAthleteProfile', { extra: { athleteId: athleteDoc.id } });
    return null;
  }
}

module.exports = refreshAthleteProfile;
