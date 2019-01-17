const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity')
const {
  gqlQuery,
  getGqlActivity,
  getGqlAthlete,
} = require('./gqlQueries');

async function getAthleteDoc(id) {
  const doc = await Athlete.findById(id);
  if (!doc) {
    console.log(`Athlete ${id} was not found in MongoDB`);
    process.exit(0);
  }
  return doc;
}

async function getActivityDoc(id) {
  const doc = await Activity.findById(id);
  if (!doc) {
    console.log(`Activity ${id} was not found in MongoDB`);
    process.exit(0);
  }
  return doc;
}

async function processBatches(
  model,
  processor,
  batchSize = 500,
  force = false
) {
  let completedBatches = false;
  let batchIndex = 0;
  while(!completedBatches) {
    const skip = batchIndex * batchSize;
    const foundDocs = await model.find({}, null, { skip, limit: batchSize });
    if (foundDocs.length === 0) {
      console.log('No documents found');
      break;
    }

    console.log(`Processing docs ${skip + 1}-${skip + foundDocs.length}`);
    for (let idx = 0; idx < foundDocs.length; idx++) {
      await processor(foundDocs[idx], force);
    }
    batchIndex += 1;
    if (foundDocs.length < batchSize) {
      console.log(`Completed processing ${skip + foundDocs.length} documents`);
      completedBatches = true;
    }
  }
}

async function checkIfExists(
  stravaId,
  nodeQuery,
  shouldForce,
  deletionQuery,
  deletionResponseKey,
  typeName,
) {
  const [getGqlNode, args] = nodeQuery;
  const gqlNode = await getGqlNode(...args);
  if (gqlNode) {
    if (shouldForce) {
      const gqlNodeDeleted = await gqlQuery(deletionQuery);
      if (!gqlNodeDeleted[deletionResponseKey]) {
        console.error(`mutation ${deletionResponseKey} failed`);
        process.exit(1);
      }
    } else {
      console.log(`${typeName} ${stravaId} already exists on Prisma server. Use --force flag to overwrite.`)
      process.exit(0);
    }
  }
}

module.exports = {
  getAthleteDoc,
  getActivityDoc,
  processBatches,
  checkIfExists,
};
