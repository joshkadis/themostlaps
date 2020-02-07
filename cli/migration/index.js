const { setupThenCommand: migrateStatsCommand } = require('./stats');
const { setupThenCommand: migrateActivitiesCommand } = require('./activities');

module.exports = {
  command: [
    'migration <subcommand> [<subargs...>]',
  ],
  describe: 'Migration commands affecting all athletes',
  handler: async (args) => {
    switch (args.subcommand) {
      case 'athletestats':
        migrateStatsCommand(args);
        break;

      case 'activitieslocation':
        migrateActivitiesCommand(args);
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
