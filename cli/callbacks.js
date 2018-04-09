require('dotenv').config();
const mongoose = require('mongoose');
const promptly = require('promptly');
const deleteUser = require('./deleteUser');
const deleteUserActivities = require('./deleteUserActivities');
const { daysAgoTimestamp } = require('./utils');
const Athlete = require('../schema/Athlete');
const refreshAthlete = require('../utils/refreshAthlete');
const subscribeToMailingList = require('../utils/subscribeToMailingList');
const getActivityInfo = require('./getActivityInfo');
const sendEmailNotification = require('./sendEmailNotification')
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

const callbackDeleteUser = async ({ user, deauthorize }) => {
  await doCommand(
    `Enter admin code to delete user ${user}.`,
    () => deleteUser(user, deauthorize)
  );
};

const callbackDeleteUserActivities = async ({ user, daysago }) => {
  if (0 === daysago) {
    console.log('daysago must be >=1')
    process.exit(0);
  }

  const after = daysAgoTimestamp(daysago);
  await doCommand(
    `Enter admin code to delete activities for user ${user} from last ${daysago} days.`,
    () => deleteUserActivities(user, after)
  );
};

const callbackRefreshUser = async ({ user, daysago }) => {
  await doCommand(
    `Enter admin code to refresh user ${user}.`,
    async () => {
      const athleteDoc = await Athlete.findBy(user);
      if (!athleteDoc) {
        console.log(`User ${user} not found`)
        process.exit(0);
      }
      await refreshAthlete(
        athleteDoc,
        'undefined' !== typeof daysago  && daysago ?
          daysAgoTimestamp(daysago) :
          false,
        true
      );
      process.exit(0);
    }
  );
}

const callbackSubscribe = async (argv) => {
  const newsletter = !!argv.newsletter;
  await doCommand(
    `Enter admin code to subscribe ${argv.email} to the email list${newsletter ? ' AND the newsletter' : ''}.`,
    async () => {
      await subscribeToMailingList(argv.email, newsletter);
      process.exit(0);
    }
  );
}

const callbackActivityInfo = async ({ user, activity }) => {
  await doCommand(
    `Enter admin code to fetch details for user ${user} activity ${activity}.`,
    () => getActivityInfo(user, activity)
  );
}

const callbackMailgun = async ({ user, type }) => {
  await doCommand(
    `Enter admin code to send ${type} email notification to user ${user}`,
    () => sendEmailNotification(user, type)
  );
}

module.exports = {
  callbackDeleteUser,
  callbackDeleteUserActivities,
  callbackRefreshUser,
  callbackSubscribe,
  callbackActivityInfo,
  callbackMailgun,
};
