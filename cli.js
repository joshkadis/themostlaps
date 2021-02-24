#!/usr/bin/env node
/* eslint-disable prefer-destructuring,import/order */

require('dotenv').config();
const {
  callbackDeleteUser,
  callbackDeleteUserActivities,
  callbackRefreshUser,
  callbackRefreshMany,
  callbackRetryWebhooks,
  callbackColdLaps,
  callbackMigrateToken,
} = require('./cli/callbacks');

const { coldLapsPoints: { startActivity } } = require('./config');

function createPositionals(...args) {
  return (yargs) => {
    args.forEach((arg) => yargs.positional(arg[0], arg[1]));
  };
}

/* eslint-disable-next-line */
const setupArgv = require('yargs')
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
    async (argv) => callbackDeleteUser(argv),
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
    async (argv) => callbackDeleteUserActivities(argv),
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
    async (argv) => callbackRefreshUser(argv),
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
    async (argv) => callbackRefreshMany(argv),
  )
  .command(
    'retrywebhooks startdate [--dry-run]',
    false,
    createPositionals(
      ['startdate', { type: 'number' }],
      ['dry-run', { type: 'boolean', default: false }],
    ),
    async (argv) => callbackRetryWebhooks(argv),
  )
  .command(
    'coldlaps [startactivity] [--dry-run]',
    false,
    createPositionals(
      ['startactivity', { type: 'number', default: startActivity }],
      ['dry-run', { type: 'boolean', default: false }],
    ),
    async (argv) => callbackColdLaps(argv),
  )
  .command(
    'migratetoken [athlete] [--find] [--options] [--dry-run] [--refresh]',
    false,
    createPositionals(
      ['athlete', { type: 'number', default: 0 }],
      ['find', { type: 'string', default: '' }],
      ['options', { type: 'string', default: '' }],
      ['dry-run', { type: 'boolean', default: false }],
      ['refresh', { type: 'boolean', default: false }],
    ),
    async (argv) => callbackMigrateToken(argv),
  )
  .command(require('./cli/activity'))
  .command(require('./cli/athlete'))
  .command(require('./cli/stats'))
  .command(require('./cli/migration'))
  .help()
  .argv;
