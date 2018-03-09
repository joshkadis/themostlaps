#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const promptly = require('promptly');
const deleteUser = require('./cli/deleteUser');
const deleteUserActivities = require('./cli/deleteUserActivities');
const { daysAgoTimestamp } = require('./cli/utils');
const refreshAthlete = require('./utils/refreshAthlete');
const subscribeToMailingList = require('./utils/subscribeToMailingList');
const Athlete = require('./schema/Athlete');

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
  /**
   * Delete a user
   */
  .command(
    'delete user',
    false,
    userPositional,
    async ({ user }) => {
      await doCommand(
        `Enter admin code to delete user ${user}.`,
        () => deleteUser(user)
      );
    }
  )
  /**
   * Delete a user's activities from the last n days
   */
  .command(
    'deleteactivities user daysago',
    false,
    (yargs) => {
      yargs.positional('user', {
        type: 'number',
      });
      yargs.positional('daysago', {
        type: 'number',
      });
    },
    async ({ user, daysago }) => {
      if (0 === daysago) {
        console.log('daysago must be >=1')
        process.exit(0);
      }

      const after = daysAgoTimestamp(daysago);
      await doCommand(
        `Enter admin code to delete activities for user ${user} from last ${daysago} days.`,
        () => deleteUserActivities(user, after)
      );
    }
  )
  /**
   * Refresh a user for the last n days
   */
  .command(
    'refresh user daysago',
    false,
    (yargs) => {
      yargs.positional('user', {
        type: 'number',
      });
      yargs.positional('daysago', {
        type: 'number',
      });
    },
    async ({ user, daysago }) => {
      const after = daysAgoTimestamp(daysago);
      await doCommand(
        `Enter admin code to refresh user ${user}.`,
        async () => {
          const athleteDoc = await Athlete.findById(user);
          if (!athleteDoc) {
            console.log(`User ${user} not found`)
            process.exit(0);
          }
          await refreshAthlete(athleteDoc, after);
          process.exit(0);
        }
      );
    }
  )
  /**
   * Subscribe someone to the email list
   */
  .command(
    'subscribe email [--newsletter]',
    false,
    (yargs) => {
      yargs.positional('email', {
        type: 'string',
      });
    },
    async (argv) => {
      const newsletter = !!argv.newsletter;
      await doCommand(
        `Enter admin code to subscribe ${argv.email} to the email list${newsletter ? ' AND the newsletter' : ''}.`,
        async () => {
          await subscribeToMailingList(argv.email, newsletter);
          process.exit(0);
        }
      );
    }
  )
  .argv;
