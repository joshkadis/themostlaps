const { setupThenCommand: migrateStatsCommand } = require('./stats');

module.exports = {
  command: [
    'migrate <subcommand> [<subargs...>]',
  ],
  describe: 'Migration commands affecting all athletes',
  handler: async (args) => {
    switch (args.subcommand) {
      case 'stats':
        migrateStatsCommand(args);
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
