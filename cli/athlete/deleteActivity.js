const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');
const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const { deleteActivityFromAthleteStats } = require('../../utils/v2/stats/deleteActivityFromAthlete');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete ingestv2');
const DRY_RUN_MSG = '** THIS IS A DRY RUN **';

// eslint-disable-next-line
function summarizeActivity({ id, laps, start_date_local, location }) {
  // eslint-disable-next-line
  console.log(`${"\n"}Deleting activity ${id}: ${laps} laps | ${start_date_local} | ${location}`);
}

function summarizeStats({ locations }, location, year) {
  console.log(`Location ${location}: ${year} | ${locations[location].byYear[year]} laps`);
  console.log(`Monthly totals: ${locations[location].byMonth[year].join(', ')}`);
}
/**
 * Redo activities ingestion for a given athlete
 */
async function doCommand({
  subargs,
  dryRun: isDryRun = false, // Currently forcing true in index.js
}) {
  if (!checkNumArgs(subargs, 2, '<athleteId> <activityId> [--dry-run]')) {
    return;
  }
  const activityDoc = await Activity.findOne({
    athlete_id: subargs[0],
    _id: subargs[1],
  });
  if (!activityDoc) {
    console.log(`Could not find Activity ${subargs[1]} for Athlete ${subargs[0]}`);
    return;
  }
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }
  summarizeActivity(activityDoc);
  console.log('BEFORE');
  const prevAthleteDoc = await Athlete.findById(subargs[0]).lean();
  if (prevAthleteDoc) {
    summarizeStats(
      prevAthleteDoc.stats,
      activityDoc.location,
      parseInt(activityDoc.start_date_local, 10), // year
    );
  }

  const nextAthleteDoc = await deleteActivityFromAthleteStats(
    activityDoc,
    isDryRun,
  );

  // eslint-disable-next-line
  console.log(`${"\n"}AFTER`);
  summarizeStats(
    nextAthleteDoc.stats,
    activityDoc.location,
    parseInt(activityDoc.start_date_local, 10), // year
  );
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
