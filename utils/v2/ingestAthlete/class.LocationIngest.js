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
const { makeArrayAsyncIterable } = require('../asyncUtils');
const { transformAthleteStats } = require('../stats/athleteStats');
const { compareActivityLocations } = require('../models/activity');
const { dedupeSegmentEfforts } = require('../../refreshAthlete/utils');

const INGEST_SOURCE = 'signup';
const MIN_ACTIVITY_ID = 1000;
const DEFAULT_FETCH_OPTS = {
  limitPages: 0,
  limitPerPage: 200,
};

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
   * @type {String} Name of location being ingested
   */
  locationName = '';

  /**
   * @type {Athlete} Document for athlete to ingest
   */
  athleteDoc = false;

  /**
   * @type {Boolean} Does not save to database if true
   */
  isUnitTest = false;

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
      this.locationName = getLocationNameFromSegmentId(segmentId);
    } else {
      slackError(131, athleteDoc);
      throw new Error('LocationIngest with invalid canonical segment ID');
    }
  }

  /**
   * Fetch and process historical activities for a location
   *
   * @param {Object} opts
   * @param {Integer} opts.limitPages Limit number of pages of activities to import
   */
  async fetchActivities(opts = {}) {
    // Error should be caught by caller
    this.segmentEfforts = await this.fetchSegmentEfforts(1, [], opts);

    if (!this.segmentEfforts.length) {
      return;
    }

    this.segmentEfforts.forEach((effort) => {
      this.processEffort(effort);
    });
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
    const activityId = Number(id);
    if (
      !activityId
      || Number.isNaN(activityId)
      || activityId < MIN_ACTIVITY_ID
    ) {
      return;
    }

    // Create activity if not exists
    let lapsFromCreatedActivity = 0;
    if (!this.activities[activityId]) {
      const activityData = this.formatActivity(effortRaw);
      if (activityData) {
        this.activities[activityId] = activityData;
        lapsFromCreatedActivity = activityData.laps;
      } else {
        return;
      }
    }
    // Create and add SegmentEffort to activity
    const prevNumSegmentEfforts = this.activities[activityId]
      .segmentEfforts
      .length;
    this.addSegmentEffortToActivity(activityId, effortRaw);
    const newNumSegmentEfforts = this.activities[activityId]
      .segmentEfforts
      .length;

    // Dedupe and hopefully increment activity's laps
    if (newNumSegmentEfforts > prevNumSegmentEfforts) {
      // This should always be 1
      const delta = newNumSegmentEfforts - prevNumSegmentEfforts;
      this.activities[activityId].laps += delta;
      lapsFromCreatedActivity += delta;
    }


    this.updateStatsFromSegmentEffort(
      start_date,
      lapsFromCreatedActivity,
      this.activities[activityId].laps,
    );
  }

  /**
   * Update location's stats after handling new segment effort
   * Creates stats in v1 format, use getStatsV2 to transform
   * @todo Generate stats in v2 format, deprecate v1
   *
   * @param {String} start_date
   * @param {Integer} incrementStatsBy
   * @param {Integer} activityLaps
   */
  updateStatsFromSegmentEffort(start_date, incrementStatsBy, activityLaps) {
    // Process for stats, assume start date in ISO format
    const yearKey = `_${start_date.slice(0, 4)}`;
    const monthKey = `${yearKey}_${start_date.slice(5, 7)}`;

    // Increment allTime, yearly, monthly
    this.stats.allTime += incrementStatsBy;
    this.stats[yearKey] = this.stats[yearKey]
      ? (this.stats[yearKey] + incrementStatsBy)
      : incrementStatsBy;
    this.stats[monthKey] = this.stats[monthKey]
      ? (this.stats[monthKey] + incrementStatsBy)
      : incrementStatsBy;

    // Check for single ride max
    if (activityLaps > this.stats.single) {
      this.stats.single = activityLaps;
    }
  }

  /**
   * Append new segment effort to an activity
   */
  addSegmentEffortToActivity(activityId, effortRaw) {
    if (!this.activities[activityId]) {
      return;
    }
    const newSegmentEffort = this.formatSegmentEffort(effortRaw);
    if (newSegmentEffort) {
      const segmentEfforts = this.activities[activityId].segmentEfforts
        ? [...this.activities[activityId].segmentEfforts, newSegmentEffort]
        : [newSegmentEffort];

      // Would be preferable to dedupe after all segment efforts have been added
      // but that would require changing a bunch of logic in this class
      this.activities[activityId].segmentEfforts = dedupeSegmentEfforts(
        segmentEfforts,
      );
    }
  }

  /**
   * Save documents for validated activities sequentially,
   * which is how Model.create() does it anyway. But we want to
   * catch validation errors one at a time.
   */
  async saveActivities() {
    const iterable = makeArrayAsyncIterable(
      this.getActivityIds(),
      this.validateAndSaveActivity,
    );

    // eslint-disable-next-line
    for await (const validation of iterable) {
      // validateAndSaveActivity will return false object if it was succ
      const {
        activity,
        error,
      } = validation;
      if (error) {
        console.log(error);
        this.invalidActivities = [...this.invalidActivities, activity];
      }
    }
  }

  /**
   * Validates an activity and saves it to the database
   *
   * @param {Integer} id
   * @returns {Activity} returns.activity Activity document or maybe an id
   * @returns {Boolean|String} returns.error false if all good, string if error
   */
  validateAndSaveActivity = async (id) => {
    // Gets raw activity data from this class, not from DB
    const data = this.getActivityById(id);
    if (!data) {
      return {
        activity: { id },
        error: new Error(`Unknown activity id: ${JSON.stringify(id)}`),
      };
    }

    const activityDoc = new Activity(data);

    // Validate activity against Activity model
    const validated = activityDoc.validateSync();
    if (!validated) {
      return {
        activity: activityDoc,
        error: `Invalid activity ${activityDoc.id}`,
      };
    }

    // Insert Activity
    // If an activity has laps in 2 locations,
    // only one Activity will be saved, for the one with more laps.
    // Athlete.stats will be accurate for both locations though.
    // Will fall back to default location
    // @todo Handle activity with multiple locations
    const existing = await Activity.findById(id);
    activityDoc.update(compareActivityLocations(activityDoc, existing));
    await existing.remove();
    await activityDoc.save({
      upsert: true,
      omitUndefined: true,
      setDefaultsOnInsert: true,
    });

    return {
      activity: activityDoc,
      error: false,
    };
  }

  /**
   * Get complete history of athlete's efforts for canonical segment
   *
   * @return {Array}
   */
  async fetchSegmentEfforts(page = 1, allEfforts = [], opts = {}) {
    const athleteId = this.athleteDoc.id;
    const {
      limitPages = DEFAULT_FETCH_OPTS.limitPages,
      limitPerPage = DEFAULT_FETCH_OPTS.limitPerPage,
    } = opts;

    const efforts = await fetchStravaAPI(
      `/segments/${this.segmentId}/all_efforts`,
      this.athleteDoc,
      {
        athlete_id: athleteId,
        per_page: limitPerPage,
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

    // Enforce page limit
    const returnEfforts = [...allEfforts, ...efforts];
    if (limitPages && page >= limitPages) {
      return returnEfforts;
    }

    /* eslint-disable-next-line no-return-await */
    return await this.fetchSegmentEfforts(
      (page + 1),
      returnEfforts,
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
    athlete_id: this.athleteDoc.id,
    laps: this.shouldAddExtraLap ? 1 : 0,
    segmentEfforts: [],
    source: INGEST_SOURCE,
    start_date_local,
    startDateUtc: start_date,
    location: this.locationName,
  });

  /**
   * Save stats for athleteDoc using v2 format
   */
  async saveStatsV2() {
    const locationStats = {
      [this.locationName]: this.getStatsV2(),
    };

    const updatedStats = {
      ...this.athleteDoc.stats,
      locationStats,
    };
    this.athleteDoc.update({
      stats_version: 'v2',
      stats: updatedStats,
    });
    this.athleteDoc.markModified('stats');
    await this.athleteDoc.save();
  }

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
   * Get an activity data object by ID
   *
   * @param {Integer} id
   * @return {Object|false}
   */
  getActivityById = (id) => this.activities[id] || false;

  /**
   * Get number of activities, for logging
   */
  getNumActivities = () => Object.keys(this.activities).length;

  /**
   * Get array of activity ids for this segment
   *
   * @return {[Integer]}
   */
  getActivityIds = () => Object.keys(this.activities)
    .map((id) => this.activities[id]._id);

  /**
   * Get stats object for this segment in v1 format
   *
   * @return {Object}
   */
  getStatsV1 = () => this.stats;

  /**
   * Get stats object for this segment in v2 format
   * @todo Make this default behavior, deprecate v1
   *
   * @return {Object}
   */
  getStatsV2 = () => transformAthleteStats(this.stats);
}

module.exports = LocationIngest;
