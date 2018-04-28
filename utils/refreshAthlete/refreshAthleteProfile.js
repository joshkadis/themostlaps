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
    console.log(`Could not refresh athlete ${athlete}`);
    return null;
  }

  try {
    const {
      firstname,
      lastname,
      profile,
      email,
    } = await fetchStravaAPI(
      '/athlete/',
      athleteDoc.get('access_token')
    );

    console.log(`Updating ${firstname} ${lastname} (${athleteDoc.get('_id')})`);

    const currentDate = new Date();
    athleteDoc.set({
      athlete: {
        firstname,
        lastname,
        profile,
        email,
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
