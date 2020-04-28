const { setupThenCommand: migrateStatsCommand } = require('./stats');
const { setupThenCommand: migrateActivitiesCommand } = require('./activities');
const { setupThenCommand: ingestLocationCommand } = require('./ingestLocation');
const { setupThenCommand: recalculateStatsCommand } = require('./recalculateStats');
const { setupThenCommand: prepDocumentsCommand } = require('./prepDocuments');
const { setupThenCommand: qaCommand } = require('./qa');
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
      case 'recalculatestats':
        usePrompt(
          recalculateStatsCommand,
          'Will overwrite stats for *all athletes*',
        );
        break;

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

      case 'ingestlocation':
        usePrompt(
          ingestLocationCommand,
          'Will ingest a location for all athletes in v2 format.',
        );
        break;

      case 'prepdocuments':
        usePrompt(
          prepDocumentsCommand,
          'Will mark all athletes and activities with version.',
        );
        break;

      case 'qa':
        qaCommand(args);
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
