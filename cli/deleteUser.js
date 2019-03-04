const fetch = require('isomorphic-unfetch');
const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity');
const { getAccessToken } = require('../utils/getAccessToken');

/**
 * Delete user and their activities from the database
 * Then deauthorize Strava API
 * Then exit the process
 *
 * @param {Number} id
 */
module.exports = async (id, shouldDeauthorize = false) => {
  try {
    // Find athlete to delete
    const athleteDoc = await Athlete.findById(id);
    if (!athleteDoc) {
      console.log(`Could not find athlete ID ${id}`);
      process.exit(0);
    }

    // Delete athlete's activities
    await Activity.deleteMany({ athlete_id: id });
    console.log(`Deleted user ${id}'s activities`);

    // Maybe deauthorize Strava API access
    if (shouldDeauthorize) {
      const access_token = await getAccessToken(athleteDoc);
      const response = await fetch(
        `https://www.strava.com/oauth/deauthorize?access_token=${access_token}`,
        { method: 'POST' }
      );

      if (200 === response.status) {
        console.log('Deauthorized Strava app');
      } else {
        responseJson = await response.json()
        console.log('Error deauthorizing Strava API', responseJson);
      }
    }

    // Delete athlete
    await athleteDoc.remove();
    console.log(`Deleted user ${id} from athletes collection`);

    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
