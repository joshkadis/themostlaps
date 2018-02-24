#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const promptly = require('promptly');
const deleteUser = require('./cli/deleteUser');
const { daysAgoTimestamp } = require('./cli/utils');
const refreshAthlete = require('./utils/refreshAthlete');

function userPositional(yargs) {
  yargs.positional('user', {
    type: 'number',
  });
}

/**
 * Prompt for admin code then connect and run command
 *
 * @param {String} prompt
 * @param {Func} callback Callback function is responsible for exiting the process
 * @param {Bool} Return true or exit if invalid admin code
 */
async function doCommand(prompt, callback) {
  const code = await promptly.prompt(prompt, { silent: true });
  if (code !== process.env.ADMIN_CODE) {
    console.log('Invalid admin code.');
    process.exit(0);
  }

  mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  db.once('open', callback);
}

const argv = require('yargs')
  .usage('$0 <cmd> [args]')
  .command(
    'delete user',
    false,
    userPositional,
    async ({ user }) => {
      await doCommand(
        `Enter the admin code to delete user ${user}.`,
        () => deleteUser(user)
      );
    }
  )
  .command(
    'refresh user [--daysago <DAYS>]',
    false,
    userPositional,
    async ({ user, daysago }) => {
      const after = daysAgoTimestamp(daysago);
      await doCommand(
        `Enter the admin code to refresh user ${user}.`,
        () => refreshAthlete(user, after)
      );
    }
  )
  .argv;
