const migrateAthleteData = require('../migration/types/athlete');
const migrateAthleteStats = require('../migration/types/stats');

function migrateUser(type, user, force) {
  switch (type) {
    case 'athlete':
      migrateAthleteData(user, force);
      break;

    case 'stats':
      migrateAthleteStats(user, force);
      break;

    // case: 'activities'

    default:
      console.log('Migration type must be one of: athlete, stats, activities');
      process.exit(0);
  }
}

module.exports = migrateUser;
