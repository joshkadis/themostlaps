#!/usr/bin/env node
const {
  callbackDeleteUser,
  callbackDeleteUserActivities,
  callbackRefreshUser,
  callbackSubscribe,
  callbackActivityInfo,
  callbackMailgun,
  callbackRefreshBatch,
} = require ('./cli/callbacks');

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
   * Subscribe someone to the MailChimp list, maybe in the newsletter group
   */
  .command(
    'subscribe email [--newsletter]',
    false,
    createPositionals(
      ['email', { type: 'string' }],
      ['newsletter', { type: 'boolean', default: false }],
    ),
    async (argv) => await callbackSubscribe(argv),
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
   * Process batch of athletes w/ simulated nightly refresh
   */
  .command(
    'refreshbatch limit skip',
    false,
    createPositionals(
      ['limit', { type: 'number' }],
      ['skip', { type: 'number' }],
    ),
    async (argv) => await callbackRefreshBatch(argv),
  )
  .argv;
