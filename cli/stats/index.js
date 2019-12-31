const { setupThenCommand: dedupeCommand } = require('./dedupe');
const { setupThenCommand: formatEffortsCommand } = require('./formatEfforts');
const { setupThenCommand: recalculateCommand } = require('./recalculateAthletes');

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

      case 'recalculate':
        recalculateCommand(args);
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
