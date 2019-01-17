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
    [getGqlActivity, [migrate_id, '{ strava_id }']],
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
  let activityQueryData;
  try {
    const activityStatsData = getActivityStatsQueriesData(activityJson);
    const segmentEffortsData = getSegmentEffortsQueriesData(activityJson);
    activityQueryData = getActivityQueryData(
      activityJson,
      activityStatsData,
      segmentEffortsData
    );
  } catch (err) {
    console.log(err);
    console.log(activityJson);
    process.exit(1);
  }

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


  // mutation to create Activity with AcitivityStats and SegmentEfforts
  const activityCreated = await gqlQuery(mutation);

  if (!activityCreated.createActivity) {
    console.log('GraphQL createActivity failed');
    console.log(mutation);
    process.exit(1);
  }

  const {
    strava_id,
    stats,
    segment_efforts,
  } = activityCreated.createActivity;
  console.log(`Created Activity ${strava_id} | ${stats.length} ActivityStats | ${segment_efforts.length} SegmentEfforts`);
  process.exit(0);
}

module.exports = migrateActivityData;
