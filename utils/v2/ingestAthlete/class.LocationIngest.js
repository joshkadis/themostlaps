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
   * @type {Array} Validated Activity documents to save
   */
  activityDocs = [];

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
      .segment_efforts
      .length;
    this.addSegmentEffortToActivity(activityId, effortRaw);
    const newNumSegmentEfforts = this.activities[activityId]
      .segment_efforts
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
      const segment_efforts = this.activities[activityId].segment_efforts
        ? [...this.activities[activityId].segment_efforts, newSegmentEffort]
        : [newSegmentEffort];

      // Would be preferable to dedupe after all segment efforts have been added
      // but that would require changing a bunch of logic in this class
      this.activities[activityId].segment_efforts = dedupeSegmentEfforts(
        segment_efforts,
      );
    }
  }

  /**
   * Create Activity documents from formatted data
   * and validate so they can be saved
   */
  prepareActivities() {
    Object.values(this.getRawActivities()).forEach((rawActivity) => {
      const activityDoc = new Activity(rawActivity);

      // Validate activity against Activity model
      const validationError = activityDoc.validateSync();
      if (validationError) {
        this.invalidActivities.push({
          activity: activityDoc,
          error: `Activity ${activityDoc.id} validation errors: ${JSON.stringify(validationError.errors)}`,
        });
      } else {
        this.activityDocs.push(activityDoc);
      }
    });
  }

  /**
   * Save documents for validated activities sequentially,
   * which is how Model.create() does it anyway. But we want to
   * catch validation errors one at a time.
   */
  async saveActivities() {
    const iterable = makeArrayAsyncIterable(
      this.getActivityDocs(),
      this.saveActivity,
    );

    let numSaved = 0;
    let totalLaps = 0;
    // eslint-disable-next-line
    for await (const lapsSaved of iterable) {
      numSaved += 1;
      totalLaps += lapsSaved;
    }
    console.log(`${numSaved} activities | ${totalLaps} total laps`);
  }

  /**
   * Validates an activity and saves it to the database
   *
   * @param {Activity} activityDoc
   * @returns {Number} Number of laps for activity, for logging
   */
  saveActivity = async (activityDoc) => {
    // Insert Activity
    // If an activity has laps in 2 locations,
    // only one Activity will be saved, for the one with more laps.
    // Athlete.stats will be accurate for both locations though.
    // Will fall back to default location
    // @todo Handle activity with multiple locations
    const existing = await Activity.findById(activityDoc.id);
    if (existing) {
      const {
        id: newId,
        location: newLocation,
        laps: newLaps,
      } = activityDoc;
      const {
        location: prevLocation = false,
        laps: prevLaps,
      } = existing;
      if (prevLocation && prevLocation !== newLocation) {
        console.log(`Multi-location activity ${newId} | New: ${newLocation} ${newLaps} | Prev: ${prevLocation} ${prevLaps}`);
      }
      activityDoc.set(compareActivityLocations(activityDoc, existing));
      await existing.remove();
    }
    await activityDoc.save({
      upsert: true,
      omitUndefined: true,
      setDefaultsOnInsert: true,
    });

    // For logging
    return activityDoc.laps;
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
    startDateUtc: new Date(start_date),
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
    segment_efforts: [],
    source: INGEST_SOURCE,
    start_date_local,
    startDateUtc: new Date(start_date),
    location: this.locationName,
  });

  /**
   * Save stats for athleteDoc using v2 format
   */
  async saveStatsV2() {
    const updatedStats = {
      ...this.athleteDoc.stats,
      locations: {
        ...this.athleteDoc.stats.locations,
        [this.locationName]: this.getStatsV2(),
      },
    };

    const locations = [...this.athleteDoc.locations];
    if (locations.indexOf(this.locationName) === -1) {
      locations.push(this.locationName);
    }

    this.athleteDoc.set({
      locations,
      stats_version: 'v2',
      stats: updatedStats,
    });
    this.athleteDoc.markModified('locations');
    this.athleteDoc.markModified('stats');
    await this.athleteDoc.save();
  }

  /**
   * Get array of activities stored in this class JS objects
   *
   * @return {[Activity]}
   */
  getRawActivities = () => Object.values(this.activities);

  /**
   * Get activity data object by ID, stored in this class as JS object
   *
   * @param {Integer} id
   * @return {Object|false}
   */
  getRawActivityById = (id) => this.activities[id] || false;

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

  /**
   * Get Activity documents
   *
   * @return {Object}
   */
  getActivityDocs = () => this.activityDocs;
}

module.exports = LocationIngest;
