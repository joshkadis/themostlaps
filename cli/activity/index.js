const { setupThenCommand: dedupeCommand } = require('./dedupe');
const { setupThenCommand: queueCommand } = require('./queue');
const { setupThenCommand: ingestCommand } = require('./ingest');

module.exports = {
  command: [
    'activity <subcommand> [<subargs...>]',
  ],
  describe: 'Activity commands',
  handler: async (args) => {
    switch (args.subcommand) {
      case 'dedupe':
        dedupeCommand(args);
        break;

      case 'queue':
        queueCommand(args);
        break;

      case 'ingest':
        ingestCommand(args);
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
