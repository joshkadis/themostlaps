const {
  gqlQuery,
  getGqlActivity,
} = require('../gqlQueries');
const {
  getAthleteDoc,
  checkIfExists,
} = require('../helpers');

async function migrateActivityData(migrate_id, force) {
  await checkIfExists(
    migrate_id,
    (migrate_id) => getGqlActivity(migrate_id, '{ strava_id }'),
    force,
    `mutation {
      deleteActivity(where: { athlete: { strava_id: ${migrate_id} } }) {
          strava_id
      }
    }`,
    'deleteActivity',
    'Activity'
  );

  console.log(`ready to migrate Activity ${migrate_id}`);
  process.exit(0);
}

module.exports = migrateActivityData;
