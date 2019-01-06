const Athlete = require('../schema/Athlete');

async function getAthleteDoc(id) {
  const doc = await Athlete.findById(id);
  if (!doc) {
    console.log(`User ${id} was not found in MongoDB`);
    process.exit(0);
  }
  return doc;
}

module.exports = {
  getAthleteDoc,
};
