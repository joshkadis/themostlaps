const { setupThenCommand: ingestV2Command } = require('./ingestV2');
const { setupThenCommand: deleteActivityCommand } = require('./deleteActivity');
const { setupThenCommand: migrateStatsCommand } = require('./migrateStats');
const { withPrompt } = require('../utils');

module.exports = {
  command: [
    'athlete <subcommand> [<subargs...>]',
  ],
  describe: 'Stats commands',
  handler: async (args) => {
    const usePrompt = (cmd, msg) => {
      withPrompt(
        () => { cmd(args); },
        msg,
      );
    };

    switch (args.subcommand) {
      case 'ingesthistory':
        usePrompt(
          ingestV2Command,
          'Will overwrite athlete stats and activities. Data for multi-location activities MAY BE DESTROYED.',
        );
        break;

      case 'deleteactivity':
        usePrompt(
          deleteActivityCommand,
          'This will delete an activity and decrement athlete stats.',
        );
        break;

      case 'migratestats':
        usePrompt(
          migrateStatsCommand,
          'This will transform athlete stats from v1 to v2 format.',
        );
        break;

      default:
        console.log('Invalid subcommand');
    }
  },
};
