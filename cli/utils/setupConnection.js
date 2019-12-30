const mongoose = require('mongoose');
const yargs = require('yargs');
const { mongooseConnectionOptions } = require('../../config/mongodb');

/**
 * Set up DB connection then execute command(s) for submodule
 *
 * @param {Object} args CLI arguments
 * @param {Function} callback Submodule command
 */
async function setupConnection(args, callback) {
  mongoose.connect(process.env.MONGODB_URI, mongooseConnectionOptions);
  const db = mongoose.connection;
  db.once('open', async () => {
    await callback(args);
    yargs.exit();
  });
}

module.exports = {
  setupConnection,
};
