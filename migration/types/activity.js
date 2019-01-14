const prettier = require('prettier');
const {
  gqlQuery,
  getGqlActivity,
} = require('../gqlQueries');

const {
  getActivityDoc,
  checkIfExists,
} = require('../helpers');

const {
  getActivityQueryData,
  getActivityStatsQueriesData,
  getSegmentEffortsQueriesData,
} = require('./activityQueries');

async function migrateActivityData(migrate_id, force) {
  await checkIfExists(
    migrate_id,
    (migrate_id) => getGqlActivity(migrate_id, '{ strava_id }'),
    force,
    `mutation {
      deleteActivity(where: { strava_id: ${migrate_id} }) {
          strava_id
      }
    }`,
    'deleteActivity',
    'Activity'
  );

  const activityDoc = await getActivityDoc(migrate_id);
  const activityJson = activityDoc.toJSON();
  const activityStatsData = getActivityStatsQueriesData(activityJson);
  const segmentEffortsData = getSegmentEffortsQueriesData(activityJson);
  const activityQueryData = getActivityQueryData(
    activityJson,
    activityStatsData,
    segmentEffortsData
  );

  const mutation = `mutation {
    createActivity(
      data: ${activityQueryData}
    ) {
      strava_id
      stats {
        type
      }
      segment_efforts {
        strava_id
      }
    }
  }`

  console.log(prettier.format(mutation, { parser: 'graphql' }));
  process.exit(0);

  // mutation to create Activity
  const activityCreated = await gqlQuery(mutation);

  // mutations to create ActivityStats

  // mutations to create SegmentEfforts
}

module.exports = migrateActivityData;
