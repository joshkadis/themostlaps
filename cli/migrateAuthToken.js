const Athlete = require('../schema/Athlete');

function migrateSingleAthlete(athleteId, isDryRun) {
    const 
}

module.exports = async (athleteId = null, migrateAllAthletes = false, isDryRun = false) => {
  if (athleteId) {
    await migrateSingleAthlete(athleteId, isDryRun);
  } else if (migrateAllAthletes) {
    await migrateAllAthletes(isDryRun);
  }
};
