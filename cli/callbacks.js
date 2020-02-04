/* eslint-disable quotes,no-await-in-loop,no-restricted-syntax */
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
const { refreshAthletes } = require('../utils/scheduleNightlyRefresh');
const { mongooseConnectionOptions } = require('../config/mongodb');
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

  mongoose.connect(process.env.MONGODB_URI, mongooseConnectionOptions);
  const db = mongoose.connection;
  db.once('open', callback);
}

const isDryRun = (argv) => argv.dryRun || argv.dryrun || false;

const callbackDeleteUser = async ({ user, deauthorize, statuses }) => {
  await doCommand(
    `Enter admin code to delete user ${user}.`,
    () => deleteUser(user, deauthorize, statuses),
  );
};

const callbackDeleteUserActivities = async ({ user, daysago }) => {
  if (daysago === 1) {
    console.log('daysago must be >=1');
    process.exit(0);
  }

  const after = daysAgoTimestamp(daysago);
  await doCommand(
    `Enter admin code to delete activities for user ${user} from last ${daysago} days.`,
    () => deleteUserActivities(user, after),
  );
};

const callbackRefreshUser = async ({ user, daysago }) => {
  await doCommand(
    `Enter admin code to refresh user ${user}.`,
    async () => {
      const athleteDoc = await Athlete.findById(user);
      if (!athleteDoc) {
        console.log(`User ${user} not found`);
        process.exit(0);
      } else if (athleteDoc.get('status') === 'deauthorized') {
        console.log(`User ${user} is deauthorized`);
        process.exit(0);
      }
      await refreshAthlete(
        athleteDoc,
        typeof daysago && daysago !== 'undefined'
          ? daysAgoTimestamp(daysago)
          : false,
        true,
      );
      process.exit(0);
    },
  );
};

const callbackRefreshMany = async ({ users }) => {
  await doCommand(
    `Enter admin code to refresh ${users.length} users.`,
    async () => {
      /* Get number of days back to check */
      const daysagoInput = await promptly.prompt(
        'Press return to refresh from date of last update or enter a number of days to check:',
        { silent: false, default: 'last' },
      );
      const daysago = daysagoInput !== 'last' ? parseInt(daysagoInput, 10) : 0;
      if (Number.isNaN(daysago)) {
        console.log(`${daysagoInput} is not a number!`);
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

      for (let idx = 0; idx < athleteDocs.length; idx += 1) {
        const athleteDoc = athleteDocs[idx];
        if (athleteDoc.get('status') === 'deauthorized') {
          console.log(`User ${athleteDoc.get('_id')} is deauthorized`);
        }

        await refreshAthlete(
          athleteDoc,
          typeof daysago !== 'undefined' && daysago
            ? daysAgoTimestamp(daysago)
            : false,
          false,
        );
      }
      process.exit(0);
    },
  );
};

const callbackActivityInfo = async ({ user, activity, fetch }) => {
  await doCommand(
    false,
    () => getActivityInfo(user, activity, fetch),
  );
};

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
        },
      ]);
      process.exit(0);
    },
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

const callbackMigrateLocation = async (argv) => {
  const { location } = argv;
  await doCommand(
    `Enter admin code to add location '${location}' to activities`,
    async () => {
      const query = {
        location: null,
      };

      let result;
      if (isDryRun(argv)) {
        const docs = await Activity.find(query);
        result = {
          n: docs.length,
          nModified: 'n/a',
        };
      } else {
        result = await Activity.updateMany(query, { location });
      }

      const { n, nModified } = result;

      console.log(`${n} activities found; ${nModified} modified`);
      process.exit();
    },
  );
};

const callbackMigrateStats = async ({ location }) => {
  await doCommand(
    `Enter admin code to migrate athlete.stats to athlete.locations.${location}`,
    async () => {
      const queryKey = `locations.${location}`;
      const query = {
        'stats.allTime': { $gt: 0 },
        [queryKey]: null,
      };

      for await (const athleteDoc of Athlete.find(query)) {
        console.log(`Migrating stats for ${athleteDoc.get('_id')}`);
        athleteDoc.set(
          queryKey,
          athleteDoc.get('stats'),
        );
        await athleteDoc.save();
      }

      process.exit();
    },
  );
};

module.exports = {
  callbackDeleteUser,
  callbackDeleteUserActivities,
  callbackRefreshUser,
  callbackRefreshMany,
  callbackActivityInfo,
  callbackRefreshBatch,
  callbackRetryWebhooks,
  callbackColdLaps,
  callbackMigrateToken,
  callbackMigrateLocation,
  callbackMigrateStats,
};
