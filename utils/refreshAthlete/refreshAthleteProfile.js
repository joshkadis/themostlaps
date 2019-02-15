const Athlete = require('../../schema/Athlete');
const fetchStravaAPI = require('../fetchStravaAPI');

/**
 * Update athlete profile data
 *
 * @param {Number|Document} athlete
 * @return {Document|null} Updated document or null if no athlete found
 */
async function refreshAthleteProfile(athlete) {
  const athleteDoc = 'number' === typeof athlete ?
    await Athlete.findById(athlete) :
    athlete;

  if (!athleteDoc) {
    console.log(`Could not find athlete ${athlete} in db`);
    return null;
  }

  if (athleteDoc.get('status') === 'deauthorized') {
    console.log(`Athlete ${athlete} is deauthorized`);
    return null;
  }

  // @note Removed email after Strava API change, Jan 2019
  try {
    const athleteResult = await fetchStravaAPI('/athlete/', athleteDoc);
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
    console.log(err);
    return null;
  }
}

module.exports = refreshAthleteProfile;
