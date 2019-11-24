// Schema
const Activity = require('../../../schema/Activity');
const Athlete = require('../../../schema/Athlete');

// Other
const { slackError, slackSuccess } = require('../../slackNotification');
const { isValidCanonicalSegmentId } = require('../locations');

class LocationIngest {
  /*
   * @prop {Integer} ID of canonical segment for location
   */
  segmentId = 0;

  /*
   * @prop {Athlete} Document for athlete to ingest
   */
  athleteDoc = false;

  constructor(athleteDoc, segmentId) {
    if (athleteDoc instanceof Athlete) {
      this.athleteDoc = athleteDoc;
    } else {
      slackError(130, athleteDoc);
      throw new Error('LocationIngest without Athlete document');
    }

    if (isValidCanonicalSegmentId(segmentId)) {
      this.segmentId = segmentId;
    } else {
      slackError(131, athleteDoc);
      throw new Error('LocationIngest with invalid canonical segment ID');
    }
  }
}

module.exports = LocationIngest;
