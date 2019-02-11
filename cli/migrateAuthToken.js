const Athlete = require('../schema/Athlete');
const MigratedToken = require('../schema/MigratedToken');
const { getAccessToken } = require('../utils/getAccessToken');

async function migrateSingleAthlete(athleteId, isDryRun) {
    const athleteDoc = await Athlete.findById(athleteId);
    const existingMigratedTokenDoc = await MigratedToken.findOne({ athlete_id: athleteId });

    if (existingMigratedTokenDoc) {
      if (athleteDoc.get('did_migrate_token')) {
        console.log('Token already migrated');
      } else {
        athleteDoc.set('did_migrate_token', true);
        await athleteDoc.save();
        console.log('Token already migrated; updated Athlete.did_migrate_token')
      }
      process.exit(0);
    }

    if (existingMigratedTokenDoc) {
      console.log()
    }

    const migratedToken = await getAccessToken(athleteDoc, true);
    console.log('Received from getAccessToken', migratedToken);

    const migratedTokenDoc = await MigratedToken.findOne({ athlete_id: athleteId });
    if (!migratedTokenDoc) {
      console.log('Did not create MigratedToken document');
    } else {
      console.log('Created MigratedToken document', migratedTokenDoc.toJSON());
    }

    const updatedAthleteDoc = await Athlete.findById(athleteId);
    console.log(`Athlete document did_migrate_token is ${
      updatedAthleteDoc.get('did_migrate_token').toString()}`);
    process.exit(0);
}

module.exports = async (athleteId = null, migrateAllAthletes = false, isDryRun = false) => {
  if (athleteId) {
    await migrateSingleAthlete(athleteId, isDryRun);
  } else if (migrateAllAthletes) {
    await migrateAllAthletes(isDryRun);
  }
};
