// Schema
const Activity = require('../../../schema/Activity');
const Athlete = require('../../../schema/Athlete');

// Other
const { slackError } = require('../../slackNotification');
const {
  isValidCanonicalSegmentId,
  getLocationNameFromSegmentId,
} = require('../locations');
const fetchStravaAPI = require('../../fetchStravaAPI');

const INGEST_SOURCE = 'signup';

class LocationIngest {
  /**
   * @type {Boolean} Whether to add a lap to each activity to simulate
   * partial laps at start and end of activity
   */
  shouldAddExtraLap = true;

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
    try {
      this.segmentEfforts = await this.fetchSegmentEfforts();
    } catch (err) {
      // TBD
    }

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
    const { id: activityId } = activity;
    const effortFormatted = this.formatSegmentEffort(effortRaw);
    if (!this.activities[activityId]) {
      this.activities[activityId] = this.formatActivity(effortRaw);
    }
    this.activities[activityId].laps += 1;
    this.activities[activityId].segmentEfforts.push(effortFormatted);

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

  /**
   * Get complete history of athlete's efforts for canonical segment
   * @return {Array}
   */
  async fetchSegmentEfforts(page = 1, allEfforts = []) {
    const athleteId = this.athleteDoc.get('_id');

    const efforts = await fetchStravaAPI(
      `/segments/${this.segmentId}/all_efforts`,
      this.athleteDoc,
      {
        athlete_id: athleteId,
        per_page: 200,
        page,
      },
    );

    if (efforts.status && efforts.status !== 200) {
      console.log(`Error getLapEffortsHistory: ${athleteId}`);
      slackError(45, {
        athleteId,
        path: `/segments/${this.segmentId}/all_efforts`,
        page,
        efforts,
      });
      return allEfforts;
    }

    if (!efforts.length) {
      return allEfforts;
    }

    /* eslint-disable-next-line no-return-await */
    return await this.fetchSegmentEfforts(
      (page + 1),
      [...allEfforts, ...efforts],
    );
  }

  /**
   * Format segment effort into our database model shape
   *
   * @param {Object} effort Segment effort from Strava API
   * @return {Object}
   */
  formatSegmentEffort = ({
    id: _id,
    elapsed_time,
    moving_time,
    start_date_local,
    start_date,
  }) => ({
    _id,
    elapsed_time,
    moving_time,
    start_date_local,
    startDateUtc: start_date,
  });

  formatActivity = ({
    activity,
    start_date_local,
    start_date,
  }) => ({
    _id: activity.id,
    added_date: new Date().toISOString(),
    athlete_id: this.athleteDoc.get('_id'),
    laps: this.shouldAddExtraLap ? 1 : 0,
    segmentEfforts: [],
    source: INGEST_SOURCE,
    start_date_local,
    startDateUtc: start_date,
    location: getLocationNameFromSegmentId(this.segmentId),
  });
}

module.exports = LocationIngest;
