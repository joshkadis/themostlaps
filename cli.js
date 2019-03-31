#!/usr/bin/env node
const {
  callbackDeleteUser,
  callbackDeleteUserActivities,
  callbackRefreshUser,
  callbackActivityInfo,
  callbackMailgun,
  callbackMailgunAll,
  callbackRefreshBatch,
  callbackUpdateSubscriptions,
  callbackRetryWebhooks,
  callbackColdLaps,
  callbackMigrateToken,
} = require ('./cli/callbacks');

const { coldLapsPoints: { startActivity } } = require('./config');

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
    'delete user [--deauthorize]',
    false,
    createPositionals(
      ['user', { type: 'number' }],
      ['deauthorize', { type: 'boolean', default: false }]
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
   * Send an email notification via Mailgun
   */
  .command(
    'mailgun user [type]',
    false,
    createPositionals(
      ['user', { type: 'number' }],
      ['type', { type: 'string', default: 'monthly' }],
    ),
    () => {
      console.log('Mailgun commands deprecated after Strava API change, Jan 2019');
      process.exit(0);
    },
  )
  /**
   * Send an email notification via Mailgun
   */
  .command(
    'mailgun-all [--override] [--testonly]',
    false,
    createPositionals(
      ['override', { type: 'boolean', default: false }],
      ['testonly', { type: 'boolean', default: false }],
    ),
    () => {
      console.log('Mailgun commands deprecated after Strava API change, Jan 2019');
      process.exit(0);
    },
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
    'migratetoken [athlete] [--all-athletes] [--dry-run]',
    false,
    createPositionals(
      ['athlete', { type: 'number', default: null }],
      ['all-athletes', { type: 'boolean', default: false }],
      ['dry-run', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackMigrateToken(argv),
  )
  .argv;
