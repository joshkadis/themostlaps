/**
 * `$ activity queue ...` commands. We can't use `.commandDir()` because it needs
 * to be backwards-compatible
 */

const mongoose = require('mongoose');
const yargs = require('yargs');
const { mongooseConnectionOptions } = require('../../config/mongodb');
const { doCommand: doQueueCommand } = require('./queue');


async function doCommand(args) {
  if (args.queue) {
    await doQueueCommand(args);
  }
  yargs.exit();
}

module.exports = {
  command: [
    'activity queue <subargs...>',
  ],

  describe: 'Manage the asynchronous activity ingestion queue',
  handler: async (args) => {
    mongoose.connect(process.env.MONGODB_URI, mongooseConnectionOptions);
    const db = mongoose.connection;
    db.once('open', async () => {
      await doCommand(args);
    });
  },
};
