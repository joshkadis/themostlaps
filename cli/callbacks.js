const mongoose = require('mongoose');
const promptly = require('promptly');
const deleteUser = require('./deleteUser');
const deleteUserActivities = require('./deleteUserActivities');
const retryWebhooks = require('./retryWebhooks');
const { daysAgoTimestamp } = require('./utils');
const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity');
const refreshAthlete = require('../utils/refreshAthlete');
const getActivityInfo = require('./getActivityInfo');
const sendEmailNotification = require('./sendEmailNotification')
const { refreshAthletes } = require('../utils/scheduleNightlyRefresh');
const { listAliases } = require('../config/email');
const { testAthleteIds } = require('../config');
const calculateColdLaps = require('./calculateColdLaps');
const {
  migrateSingle,
  migrateMany,
} = require('./migrateAuthToken');

/**
 * Prompt for admin code then connect and run command
 *
 * @param {String|false} prompt Prompt text or false to skip
 * @param {Func} callback Callback function is responsible for exiting the process
 * @param {Bool} Return true or exit if invalid admin code
 */
async function doCommand(prompt, callback) {
  if (prompt) {
    const code = await promptly.prompt(prompt, { silent: true });
    if (code !== process.env.ADMIN_CODE) {
      console.log('Invalid admin code.');
      process.exit(0);
    }
  }

  mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  db.once('open', callback);
}

const isDryRun = (argv) => argv.dryRun || argv.dryrun || false;

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
      } else if (athleteDoc.get('status') === 'deauthorized') {
        console.log(`User ${user} is deauthorized`)
        process.exit(0);
      }
      await refreshAthlete(
        athleteDoc,
        'undefined' !== typeof daysago && daysago ?
          daysAgoTimestamp(daysago) :
          false,
        true
      );
      process.exit(0);
    }
  );
}

const callbackRefreshMany = async ({ users }) => {
  await doCommand(
    `Enter admin code to refresh ${users.length} users.`,
    async () => {
      /**
        Get number of days back to check
      **/
      const daysagoInput = await promptly.prompt(
        'Press return to refresh from date of last update or enter a number of days to check:',
        { silent: false, default: 'last' }
      );
      const daysago = daysagoInput !== 'last' ? parseInt(daysagoInput, 10) : 0;
      if (isNaN(daysago)) {
        console.log(`${daysagoInput} is not a number!`)
        process.exit(0);
      }
      console.log(`Checking ${daysago ? `${daysago} days back` : 'from last update'}`);

      const userIds = users.reduce((acc, user) => {
        if (typeof user === 'number') {
          return [...acc, user];
        }
        console.log(`${user} is not a number!`);
        return acc;
      }, []);

      const athleteDocs = await Athlete.find({ _id: { $in: userIds } });
      console.log(`Found ${athleteDocs.length} Athlete documents from ${userIds.length} user IDs${"\n"}---------------------------`);

      for (let idx = 0; idx < athleteDocs.length; idx++) {
        const athleteDoc = athleteDocs[idx];
        if (athleteDoc.get('status') === 'deauthorized') {
          console.log(`User ${athleteDoc.get('_id')} is deauthorized`)
        }

        await refreshAthlete(
          athleteDoc,
          'undefined' !== typeof daysago && daysago ?
            daysAgoTimestamp(daysago) :
            false,
          false
        );
      }
      process.exit(0);
    }
  );
}

const callbackActivityInfo = async ({ user, activity, fetch }) => {
  await doCommand(
    false,
    () => getActivityInfo(user, activity, fetch)
  );
}

const callbackMailgun = async ({ user, type }) => {
  let recipient;
  switch (user) {
    case 0:
      recipient = `mailing list ${listAliases[0]}`;
      break;

    case 1:
      recipient = `mailing list ${listAliases[1]}`;
      break;

    default:
      recipient = `user ${user}`;
  }

  await doCommand(
    `Enter admin code to send ${type} email notification to ${recipient}`,
    () => sendEmailNotification(user, type)
  );
}

const callbackMailgunAll = async ({ override, testonly }) => {
  await doCommand(
    `Enter admin code to send monthly email notification to all subscribed users`,
    async () => {
      const athletes = await Athlete.find(override ? {} : {
        preferences: {
          notifications: {
            monthly: true,
          },
        },
      });
      console.log(`Sending to ${athletes.length} users`);

      for (let i = 0; i < athletes.length; i++) {
        if (testonly || !process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
          if (-1 !== testAthleteIds.indexOf(athletes[i].get('_id'))) {
            await sendEmailNotification(athletes[i], 'monthly', false);
          }
        } else {
          await sendEmailNotification(athletes[i], 'monthly', false);
        }
      }
      process.exit(0);
    }
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

const callbackUpdateSubscriptions = async (argv) => {
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

        if (!isDryRun(argv)) {
          await athleteDoc.save();
        }
      }

      console.log(result);
      process.exit(0);
    }
  );
};

const callbackRetryWebhooks = async (argv) => {
  await doCommand(
    `Enter admin code to reimport failed activities since ${argv.startdate}.`,
    () => retryWebhooks(argv.startdate, isDryRun(argv)),
  );
};

const callbackColdLaps = async (argv) => {
  await doCommand(
    `Enter admin code to recalculate Cold Laps for all athletes.`,
    () => calculateColdLaps(argv.startactivity, isDryRun(argv)),
  );
};

const callbackMigrateToken = async (argv) => {
  await doCommand(
    'Enter admin code to migrate auth token',
    async () => {
      const {
        athlete,
        find,
        options,
        refresh,
      } = argv;
      if (athlete && find) {
        console.log('Cannot use athlete ID and find query simultaneously');
        process.exit(0);
      } else if (athlete) {
        migrateSingle(athlete, isDryRun(argv), refresh);
      } else if (find) {
        migrateMany(find, options, isDryRun(argv), refresh);
      }
    },
  );
};

module.exports = {
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
};
