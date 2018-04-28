require('dotenv').config();
const mongoose = require('mongoose');
const promptly = require('promptly');
const deleteUser = require('./deleteUser');
const deleteUserActivities = require('./deleteUserActivities');
const { daysAgoTimestamp } = require('./utils');
const Athlete = require('../schema/Athlete');
const refreshAthlete = require('../utils/refreshAthlete');
const getActivityInfo = require('./getActivityInfo');
const sendEmailNotification = require('./sendEmailNotification')
const { refreshAthletes } = require('../utils/scheduleNightlyRefresh');

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
      const athleteDoc = await Athlete.findById(user);
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

const callbackRefreshBatch = async ({ limit, skip, activities }) => {
  await doCommand(
    `Enter admin code to refresh batch of ${limit} athletes with offset ${skip}`,
    async () => {
      await refreshAthletes(activities, [
        {},
        null,
        {
          limit,
          skip,
          sort: { _id: 1 },
        }
      ]);
      process.exit(0);
    }
  );
};

const callbackUpdateSubscriptions = async ({ dryrun }) => {
  await doCommand(
    `Enter admin code to update user subscription statuses`,
    async () => {
      const newsletterSubscribers = require('../utils/emails/MCNewsletterSegment');
      const athletes = await Athlete.find();
      let result = {
        subscribed: 0,
        notSubscribed: 0,
      };
      for (let i = 0; i < athletes.length; i++) {
        const athleteDoc = athletes[i];
        const shouldBeSubscribed =
          newsletterSubscribers.indexOf(athleteDoc.get('athlete.email')) !== -1;

        athleteDoc.set({
          preferences: {
            notifications: {
              monthly: shouldBeSubscribed,
            },
          },
        });

        result[`${shouldBeSubscribed ? 's' : 'notS'}ubscribed`]++;

        if (!dryrun) {
          await athleteDoc.save();
        }
      }

      console.log(result);
      process.exit(0);
    }
  );
};

module.exports = {
  callbackDeleteUser,
  callbackDeleteUserActivities,
  callbackRefreshUser,
  callbackActivityInfo,
  callbackMailgun,
  callbackRefreshBatch,
  callbackUpdateSubscriptions,
};
