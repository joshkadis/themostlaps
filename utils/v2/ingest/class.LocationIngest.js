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
const MIN_ACTIVITY_ID = 1000;
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
   * @type {Boolean} Does not save to database if true
   */
  isMock = false;

  /**
   * @type {Array} Segment effort history for location
   */
  segmentEfforts = [];

  /**
   * @type {Object} Activities data derived from segment efforts
   */
  activities = {};

  /**
   * @type {Array} Activities that were not validated
   */
  invalidActivities = [];

  /**
   * @type {Object} Stats calculated for this location
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
  async getActivities() {
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
      activity = false,
      start_date = false,
    } = effortRaw;

    if (!activity || !start_date) {
      return;
    }

    const { id = null } = activity;
    const activityId = parseInt(id, 10);
    if (
      !activityId
      || Number.isNaN(activityId)
      || activityId < MIN_ACTIVITY_ID
    ) {
      return;
    }

    // Create activity if not exists
    if (!this.activities[activityId]) {
      const activityModel = this.formatActivity(effortRaw);
      if (activityModel) {
        this.activities[activityId] = activityModel;
      } else {
        return;
      }
    }

    // Increment activity laps
    this.incrementActivityLaps(activityId);

    // Create and add SegmentEffort to activity
    this.addSegmentEffort(activityId, effortRaw);

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
   * Increment laps for a known activity
   *
   * @param {Integer} activityId
   */
  incrementActivityLaps(activityId) {
    if (!this.activities[activityId]) {
      return;
    }
    this.activities[activityId].laps += 1;
  }

  /**
   * Append new segment effort to an activity
   */
  addSegmentEffort(activityId, effortRaw) {
    if (!this.activities[activityId]) {
      return;
    }
    const newSegmentEffort = this.formatSegmentEffort(effortRaw);
    if (newSegmentEffort) {
      const segmentEfforts = this.activities[activityId].segmentEfforts
        ? [...this.activities[activityId].segmentEfforts, newSegmentEffort]
        : [newSegmentEffort];

      this.activities[activityId].segmentEfforts = segmentEfforts;
    }
  }

  /**
   * Save documents for validated Activities
   */
  async saveActivities() {
    // @todo Handle async iterable!
    this.getActivities().forEach(async (activity) => {
      try {
        // Will remove if exists
        await Activity.remove({ _id: activity._id }, { single: true });
      } catch (err) {
        // Let's move on, shall we?
      }

      const model = new Activity(activity);
      const err = model.validateSync();
      if (err) {
        this.invalidActivities = [...this.invalidActivities, activity];
      } else if (!this.isMock) {
        try {
          await model.save();
        } catch (saveErr) {
          this.invalidActivities = [...this.invalidActivities, activity];
          console.log(saveErr);
        }
      }
    });
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
   * Format segment effort into SegmentEffort model shape
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

  /**
   * Format segment effort into Activity model shape
   *
   * @param {Object} effort Segment effort from Strava API
   * @return {Object}
   */
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

  /**
   * Does the athlete have activities for this location?
   *
   * @return {Boolean}
   */
  hasActivities = () => Object.keys(this.activities).length > 0;

  /**
   * Get array of activities for this segment as JS objects
   *
   * @return {[Activity]}
   */
  getActivities = () => Object.values(this.activities);

  /**
   * Get array of activity ids for this segment
   *
   * @return {[Integer]}
   */
  getActivityIds = () => Object.keys(this.activities)
    .map((id) => this.activities[id]._id);

  /**
   * Get stats object for this segment
   *
   * @return {Object}
   */
  getStats = () => this.stats;
}

module.exports = LocationIngest;
