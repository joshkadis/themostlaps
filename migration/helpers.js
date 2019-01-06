const Athlete = require('../schema/Athlete');

async function getAthleteDoc(id) {
  const doc = await Athlete.findById(id);
  if (!doc) {
    console.log(`User ${id} was not found in MongoDB`);
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

module.exports = {
  getAthleteDoc,
  processBatches,
};
