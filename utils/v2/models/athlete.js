/**
 * Get athlete name and id as string for logging
 *
 * @param Athlete athleteDoc
 */
function getAthleteIdentifier(athleteDoc) {
  const {
    athlete: {
      firstname,
      lastname,
    },
    _id,
  } = athleteDoc.toJSON();
  return `${firstname} ${lastname} | ${_id}`;
}

module.exports = {
  getAthleteIdentifier,
};
