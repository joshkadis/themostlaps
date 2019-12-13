const fetch = require('isomorphic-unfetch');
const Athlete = require('../schema/Athlete');
const { getUpdatedAccessToken } = require('../utils/getUpdatedAccessToken');
const { removeAthlete } = require('../utils/athleteUtils');

function checkAthleteStatus(athleteDoc, removableStatuses) {
  const athleteStatus = athleteDoc.get('status');
  // removableStatuses must include athlete's current status or 'any'
  if (
    removableStatuses.indexOf(athleteStatus) === -1
    && removableStatuses.indexOf('any') === -1
  ) {
    console.log(`Athlete ${athleteDoc.id} status '${athleteStatus}' not in ${JSON.stringify(removableStatuses)}`);
    return false;
  }
  return true;
}

/**
 * Delete user and their activities from the database
 * Then deauthorize Strava API
 * Then exit the process
 *
 * @param {Number} id
 */
module.exports = async (id, shouldDeauthorize = false, statuses) => {
  const removableStatuses = statuses.split(',');

  try {
    // Find athlete to delete
    const athleteDoc = await Athlete.findById(id);
    if (!athleteDoc) {
      console.log(`Could not find athlete ID ${id}`);
      process.exit(1);
    }

    // Maybe deauthorize Strava API access
    if (
      shouldDeauthorize
      && checkAthleteStatus(athleteDoc, removableStatuses)
    ) {
      const access_token = await getUpdatedAccessToken(athleteDoc);
      const response = await fetch(
        `https://www.strava.com/oauth/deauthorize?access_token=${access_token}`,
        { method: 'POST' },
      );

      if (response.status === 200) {
        console.log('Deauthorized Strava app');
      } else {
        const responseJson = await response.json();
        console.log('Error deauthorizing Strava API', responseJson);
      }
    }

    await removeAthlete(athleteDoc, removableStatuses);
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
