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
    'activityinfo user activity',
    false,
    createPositionals(
      ['user', { type: 'number' }],
      ['activity', { type: 'number' }],
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
    async (argv) => await callbackMailgun(argv),
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
    async (argv) => await callbackMailgunAll(argv),
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
    'updatesubscriptions [--dryrun]',
    false,
    createPositionals(
      ['dryrun', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackUpdateSubscriptions(argv),
  )
  .command(
    'retrywebhooks startdate [--dryrun]',
    false,
    createPositionals(
      ['startdate', { type: 'number' }],
      ['dryrun', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackRetryWebhooks(argv),
  )
  .command(
    'coldlaps [startactivity] [--dryrun]',
    false,
    createPositionals(
      ['startactivity', { type: 'number', default: startActivity }],
      ['dryrun', { type: 'boolean', default: false }],
  ),
    (argv) => console.log(argv)
    // async (argv) => await callbackColdLaps(argv),
  )
  .argv;
