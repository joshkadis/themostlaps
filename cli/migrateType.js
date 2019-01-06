const migrateAthleteData = require('../migration/types/athlete');
const migrateAthleteStats = require('../migration/types/stats');
const migrateConditions = require('../migration/types/conditions');

const TYPES = ['athlete', 'stats', 'conditions'];

function migrateType(type, user, force) {
  switch (type) {
    case TYPES[0]:
      migrateAthleteData(user, force);
      break;

    case TYPES[1]:
      migrateAthleteStats(user, force);
      break;

    case TYPES[2]:
      migrateConditions(force);
      break;

    default:
      console.log(`Migration type must be one of: ${TYPES.join(', ')}`);
      process.exit(0);
  }
}

module.exports = migrateType;
