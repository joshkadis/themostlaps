const fetch = require('isomorphic-unfetch');
const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity');

/**
 * Delete user and their activities from the database
 * Then deauthorize Strava API
 * Then exit the process
 *
 * @param {Number} id
 */
module.exports = async (id, shouldDeauthorize = false) => {
  try {
    // Remove from athletes collection
    const athleteDoc = await Athlete.findByIdAndRemove(id);
    if (!athleteDoc) {
      console.log(`Could not find athlete ID ${id}`);
      process.exit(0);
    } else {
      console.log(`Deleted user ${id} from athletes collection`);
    }

    // Remove from activities collection
    await Activity.deleteMany({ athlete_id: id });
    console.log(`Deleted user ${id}'s activities`);

    // Maybe deauthorize Strava API access
    if (shouldDeauthorize) {
      const { status } = await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        body: `access_token=${athleteDoc.get('access_token')}`,
      });

      if (200 === status) {
        console.log('Deauthorized Strava API');
      } else {
        console.log('Error deauthorizing Strava API');
      }
    }

    process.exit(0);
  } catch (err) {
    throw err;
  }
};
