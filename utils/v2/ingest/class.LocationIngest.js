// Schema
const Activity = require('../../../schema/Activity');
const Athlete = require('../../../schema/Athlete');

// Other
const { slackError, slackSuccess } = require('../../slackNotification');
const { isValidCanonicalSegmentId } = require('../locations');

class LocationIngest {
  /**
   * @type {Boolean} Whether to add a lap to each activity to simulate
   * partial laps at start and end of activity
   */
  shouldAddExtraLaps = true;

  /**
   * @type {Number} ID of canonical segment for location
   */
  segmentId = 0;

  /**
   * @type {Athlete} Document for athlete to ingest
   */
  athleteDoc = false;

  /**
   * @type {Array} Segment effort history for location
   */
  segmentEfforts = [];

  /**
   * @type {Array} Activity IDs in segment history
   */
  activitiesIds = [];

  /**
   * @type {Object} Activities derived from segment efforts as JSON
   */
  activities = [];

  /**
   * @type {Object} Stats calculated for location
   */
  stats = {
    allTime: 0,
    single: 0,
  };

  /**
   * Set up class
   *
   * @param {Athlete} athleteDoc
   * @param {Number} segmentId
   */
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

  /**
   * Fetch and process historical activities for a location
   */
  async ingest() {
    this.segmentEfforts = await this.fetchSegmentEfforts();
    if (!this.segmentEfforts.length) {
      return;
    }

    this.segmentEfforts.forEach(this.processEffort);
  }

  /**
   * Increment activities and stats from a segment effort
   */
  processEffort(effortRaw) {
    const {
      activity,
      start_date,
    } = effortRaw;

    // Process for activities history
    const id = activity.id;
    const effortFormatted = this.formatSegmentEffort(effortRaw);
    if (!this.activities[id]) {
      this.activities[id] = this.createActivity(activity);
    }
    this.activities[id].laps += 1;
    this.activities[id].segmentEfforts.push(effortFormatted);

    // Process for stats, assume start date in ISO format
    const yearKey = `_${start_date.slice(0, 4)}`;
    const monthKey = `${yearKey}_${start_date.slice(5, 7)}`;

    this.stats[yearKey] = this.stats[yearKey]
      ? (this.stats[yearKey] + 1)
      : 1;

    this.stats[monthKey] = this.stats[monthKey]
      ? (this.stats[monthKey] + 1)
      : 1;
  }

  /**
   * Validate activities and save
   */
  async saveActivities() {
    // Filter is valid

    // Upsert or skip if _id already exists
  }

  // fetchSegmentEfforts
  // formatSegmentEffort
  // createActivity
}

module.exports = LocationIngest;
