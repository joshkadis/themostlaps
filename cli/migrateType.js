const migrateAthleteData = require('../migration/types/athlete');
const { migrateAthleteStats } = require('../migration/types/stats');
const migrateConditions = require('../migration/types/conditions');
const migrateActivityData = require('../migration/types/activity');

const TYPES = ['athlete', 'stats', 'conditions', 'activity'];

function migrateType(type, strava_id, force) {
  switch (type) {

    case TYPES[0]:
      migrateAthleteData(strava_id, force);
      break;

    case TYPES[1]:
      migrateAthleteStats(strava_id, force);
      break;

    case TYPES[2]:
      migrateConditions(force);
      break;

    case TYPES[3]:
      migrateActivityData(strava_id, force);
      break;

    default:
      console.log(`Migration type must be one of: ${TYPES.join(', ')}`);
      process.exit(0);
  }
}

module.exports = migrateType;
