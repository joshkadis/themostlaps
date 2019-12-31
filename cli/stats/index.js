const { setupThenCommand: dedupeCommand } = require('./dedupe');
const { setupThenCommand: formatEffortsCommand } = require('./formatEfforts');

module.exports = {
  command: [
    'stats <subcommand> [<subargs...>]',
  ],
  describe: 'Stats commands',
  handler: async (args) => {
    switch (args.subcommand) {
      case 'dedupe':
        dedupeCommand(args);
        break;

      case 'formatefforts':
        formatEffortsCommand(args);
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
