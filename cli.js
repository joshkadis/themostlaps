#!/usr/bin/env node
require('dotenv').config();
const {
  callbackDeleteUser,
  callbackDeleteUserActivities,
  callbackRefreshUser,
  callbackRefreshMany,
  callbackActivityInfo,
  callbackMailgun,
  callbackMailgunAll,
  callbackRefreshBatch,
  callbackUpdateSubscriptions,
  callbackRetryWebhooks,
  callbackColdLaps,
  callbackMigrateToken,
  // callbackMigrateLocation,
  // callbackMigrateStats,
  callbackIngestAthleteV2,
} = require ('./cli/callbacks');

const { coldLapsPoints: { startActivity }, defaultLocation } = require('./config');

function createPositionals(...args) {
  return (yargs) => {
    args.forEach((arg) => yargs.positional(arg[0], arg[1]));
  };
}

const argv = require('yargs')
  .usage('$0 <cmd> [args]')
  /**
   * Delete a user
   */
  .command(
    'delete user [--deauthorize] [--statuses]',
    false,
    createPositionals(
      ['user', { type: 'number' }],
      ['deauthorize', { type: 'boolean', default: false }],
      ['statuses', { type: 'string', default: 'deauthorized' }],
    ),
    async (argv) => await callbackDeleteUser(argv),
  )
  /**
   * Delete a user's activities from the last n days
   */
  .command(
    'deleteactivities user daysago',
    false,
    createPositionals(
      ['user', { type: 'number' }],
      ['daysago', { type: 'number', default: 0 }],
    ),
    async (argv) => await callbackDeleteUserActivities(argv),
  )
  /**
   * Refresh a user since last checked activity or for the last n days
   */
  .command(
    'refresh user [daysago]',
    false,
    createPositionals(
      ['user', { type: 'number' }],
      ['daysago', { type: 'number', default: 0 }],
    ),
    async (argv) => await callbackRefreshUser(argv),
  )
  /**
   * Refresh an array of athletes since last checked activity or for the last n days
   */
  .command(
    'refresh-many <users...>',
    false,
    createPositionals(
      ['users', { type: 'array' }],
    ),
    async (argv) => await callbackRefreshMany(argv),
  )
  /**
   * Get info for a specific activity
   */
  .command(
    'activityinfo user activity [--fetch]',
    false,
    createPositionals(
      ['user', { type: 'number' }],
      ['activity', { type: 'number' }],
      ['fetch', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackActivityInfo(argv),
  )
  /**
   * Process batch of athletes w/ simulated nightly refresh
   */
  .command(
    'refreshbatch limit skip [--activities]',
    false,
    createPositionals(
      ['limit', { type: 'number' }],
      ['skip', { type: 'number' }],
      ['activities', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackRefreshBatch(argv),
  )
  /**
   * Process batch of athletes w/ simulated nightly refresh
   */
  .command(
    'updatesubscriptions [--dry-run]',
    false,
    createPositionals(
      ['dry-run', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackUpdateSubscriptions(argv),
  )
  .command(
    'retrywebhooks startdate [--dry-run]',
    false,
    createPositionals(
      ['startdate', { type: 'number' }],
      ['dry-run', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackRetryWebhooks(argv),
  )
  .command(
    'coldlaps [startactivity] [--dry-run]',
    false,
    createPositionals(
      ['startactivity', { type: 'number', default: startActivity }],
      ['dry-run', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackColdLaps(argv),
  ).command(
    'migratetoken [athlete] [--find] [--options] [--dry-run] [--refresh]',
    false,
    createPositionals(
      ['athlete', { type: 'number', default: 0 }],
      ['find', { type: 'string', default: ''}],
      ['options', { type: 'string', default: ''}],
      ['dry-run', { type: 'boolean', default: false }],
      ['refresh', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackMigrateToken(argv),
  )
  .command(
    'migratelocation [location] [--dry-run]',
    false,
    createPositionals(
      ['location', { type: 'string', default: defaultLocation }],
      ['dry-run', { type: 'boolean', default: false }],
    ),
    async (argv) => {
      console.log('migratelocation is closed for renovations.');
      process.exit();
      // await callbackMigrateLocation(argv)
    },
  )
  .command(
    'migratestats [location]',
    false,
    createPositionals(
      ['location', { type: 'string', default: defaultLocation }],
    ),
    async (argv) => {
      console.log('migratestats is closed for renovations.');
      process.exit();
      // await callbackMigrateStats(argv)
    },
  )
  .command(require('./cli/activity'))
  .command(require('./cli/athlete'))
  .command(require('./cli/stats'))
  .command(require('./cli/migration'))
  .help()
  .argv;
