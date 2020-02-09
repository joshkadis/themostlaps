const { setupThenCommand: migrateStatsCommand } = require('./stats');
const { setupThenCommand: migrateActivitiesCommand } = require('./activities');
const { withPrompt } = require('../utils');

module.exports = {
  command: [
    'migration <subcommand> [<subargs...>]',
  ],
  describe: 'Migration commands affecting all athletes',
  handler: async (args) => {
    const usePrompt = (cmd, msg) => {
      withPrompt(
        () => { cmd(args); },
        // eslint-disable-next-line quotes
        `${msg}${!args.dryRun ? '' : `${"\n"}**DRY RUN**`}`,
      );
    };

    switch (args.subcommand) {
      case 'athletestats':
        usePrompt(
          migrateStatsCommand,
          'Will migrate *all athletes* from v1 to v2 stats format.',
        );
        break;

      case 'activitieslocation':
        usePrompt(
          migrateActivitiesCommand,
          'Will create v2 stats format activityLocations for legacy prospectpark activities.',
        );
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
