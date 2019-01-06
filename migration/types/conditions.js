const { processBatches } = require('../helpers');
const Condition = require('../../schema/Condition');

BATCH_SIZE = 500;

async function processDocument(condition, force) {
  console.log(condition.get('_id'));
}

async function migrateConditions(force) {
  await processBatches(Condition, processDocument, BATCH_SIZE, force);
  process.exit(0);
}

module.exports = migrateConditions;
