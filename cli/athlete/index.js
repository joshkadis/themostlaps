const { setupThenCommand: ingestV2Command } = require('./ingestV2');
const { setupThenCommand: deleteActivityCommand } = require('./deleteActivity');
const { setupThenCommand: migrateStatsCommand } = require('./migrateStats');

const SHOULD_FORCE_DRY_RUN = false;

module.exports = {
  command: [
    'athlete <subcommand> [<subargs...>]',
  ],
  describe: 'Stats commands',
  handler: async (args) => {
    switch (args.subcommand) {
      // FORCE DRY
      case 'ingestv2':
        ingestV2Command({
          ...args,
          dryRun: SHOULD_FORCE_DRY_RUN || args.dryRun,
        });
        break;

      case 'deleteactivity':
        deleteActivityCommand(args);
        break;

      case 'migratestats':
        migrateStatsCommand(args);
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
