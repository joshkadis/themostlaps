const _uniq = require('lodash/uniq');
// Schema
const Activity = require('../../../schema/Activity');
const Athlete = require('../../../schema/Athlete');

// Other
const { captureSentry } = require('../services/sentry');
const {
  isValidCanonicalSegmentId,
  getLocationNameFromSegmentId,
} = require('../locations');
const fetchStravaAPI = require('../../fetchStravaAPI');
const { makeArrayAsyncIterable } = require('../asyncUtils');
const { compareActivityLocations } = require('../models/activityHelpers');
const { dedupeSegmentEfforts, incrementDate } = require('../../refreshAthlete/utils');
const { buildLocationsStatsFromActivities } = require('../stats/generateStatsV2');

const INGEST_SOURCE = 'signup';
const MIN_ACTIVITY_ID = 1000;
const INCREMENT_DATE_BY = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
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
  stats = {};

  /**
   * @type {String} ISO string of athlete creation date
   */
  createdAt = '2021-01-26T16:08:54Z';

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
      captureSentry('LocationIngest without Athlete document', 'LocationIngest');
    }

    this.createdAt = this.createdAt
      || this.athleteDoc.athlete.createdAt
      || null;

    if (isValidCanonicalSegmentId(segmentId)) {
      this.segmentId = segmentId;
      this.locationName = getLocationNameFromSegmentId(segmentId);
    } else {
      captureSentry('LocationIngest with invalid segment ID', 'LocationIngest', {
        segmentId,
        athleteId: athleteDoc.id,
      });
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
    if (!this.activities[activityId]) {
      const activityData = this.formatActivity(effortRaw);
      if (activityData) {
        this.activities[activityId] = activityData;
      } else {
        return;
      }
      console.log(`create | ${activityId} | ${this.activities[activityId].laps} laps`);
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
      console.log(`update | ${activityId} | ${this.activities[activityId].laps} laps`);
    } else {
      console.log(`skip | ${activityId} | ${this.activities[activityId].laps} laps`);
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
   * Update the activityLocations field of a document from one or more documents
   * that represent the same actual activity but with stats from different locations
   *
   * @param {Activity} primaryDoc
   */
  updateActivityLocations = (primaryDoc, ...docs) => {
    const {
      activityLocations: primaryLocations = [],
    } = primaryDoc.toJSON();

    const prevLocationNames = primaryLocations.length
      ? primaryLocations.map(({ location }) => location)
      : [];

    [primaryDoc, ...docs].forEach((nextDoc) => {
      const {
        id: nextId,
        location: nextLocation,
        laps: nextLaps,
        segment_efforts: nextSegmentEfforts,
      } = nextDoc;

      // Make sure we're talking about the same activity
      if (nextId !== primaryDoc.id) {
        return;
      }
      const nextLocationObj = {
        location: nextLocation,
        laps: nextLaps,
        segment_efforts: nextSegmentEfforts,
      };

      const idx = prevLocationNames.indexOf(nextLocation);
      if (idx !== -1) {
        // If this location already exists in activityLocations, update it
        primaryLocations[idx] = nextLocationObj;
      } else {
        // If this location does not exist in activityLocations, add it
        primaryLocations.push(nextLocationObj);
        prevLocationNames.push(nextLocation);
      }

      // Maybe update top-level properties of the activity
      if (nextLocation === primaryDoc.location) {
        primaryDoc.set({
          ...nextLocationObj,
        });
      }
    });

    primaryDoc.set({ activityLocations: primaryLocations });
    primaryDoc.markModified('activityLocations');
  };

  /**
   * Create Activity documents from formatted data
   * and validate so they can be saved
   */
  prepareActivities() {
    Object.values(this.getRawActivities()).forEach((rawActivity) => {
      const activityDoc = new Activity(rawActivity);
      this.updateActivityLocations(activityDoc);

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
   * Overwrites existing activity
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
      // @todo Reconcile with existing.activityLocations

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
      this.updateActivityLocations(activityDoc, existing);
      await existing.remove();
    }

    await activityDoc.save({
      upsert: true,
      omitUndefined: true,
      setDefaultsOnInsert: true,
    });

    // For logging
    return activityDoc.laps;
  };

  /**
   * Get complete history of athlete's efforts for canonical segment
   *
   * @return {Array}
   */
  async fetchSegmentEfforts(page = 1, allEfforts = [], opts = {}) {
    if (!this.createdAt) {
      const apiAthlete = await fetchStravaAPI('/athlete', this.athleteDoc);
      this.createdAt = apiAthlete.created_at;
    }
    const {
      createdAt,
      athleteDoc: {
        _id: athleteId,
      },
    } = this;
    if (page === 1) {
      console.log(`athleteId ${athleteId} | createdAt ${createdAt}`);
    }

    const {
      limitPages = DEFAULT_FETCH_OPTS.limitPages,
      limitPerPage = DEFAULT_FETCH_OPTS.limitPerPage,
      start_date_local = createdAt,
    } = opts;
    const end_date_local = incrementDate(start_date_local, INCREMENT_DATE_BY);

    const params = {
      per_page: limitPerPage,
      segment_id: this.segmentId,
      start_date_local,
      end_date_local,
    };

    console.log(`fetchSegmentEfforts | page ${page} | start_date_local ${params.start_date_local} | end_date_local ${params.end_date_local} | allEfforts.length ${allEfforts.length}`);

    const efforts = await fetchStravaAPI(
      '/segment_efforts',
      this.athleteDoc,
      params,
    );

    if (efforts.status && efforts.status !== 200) {
      captureSentry('Strava API response error', 'LocationIngest', {
        athleteId,
        path: `/segments/${this.segmentId}/all_efforts`,
        page,
        status: efforts.status,
      });
      return allEfforts;
    }

    console.log(`Received ${efforts.length} efforts`);

    if (
      allEfforts.length
      && efforts.length
      && allEfforts.slice(-1)[0].id === efforts[0].id
    ) {
      // I guess this could happen if a segment effort started
      // exactly on the previous end_date_local
      // which is the same as the new start_date_local
      efforts.shift();
    }

    const returnEfforts = [...allEfforts, ...efforts];

    if (new Date(end_date_local).valueOf() > Date.now() || page > 500) {
      console.log(`fetchSegmentEfforts finished with ${returnEfforts.length} efforts`);
      return returnEfforts;
    }

    // Enforce page limit when testing, Strava doesn't have this param
    if (limitPages && page >= limitPages) {
      console.log(`fetchSegmentEfforts hit page limit ${limitPages} with ${returnEfforts.length} efforts`);
      return returnEfforts;
    }

    return this.fetchSegmentEfforts(
      (page + 1),
      returnEfforts,
      {
        start_date_local: end_date_local, // start next request period from end of this request period
      },
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
    athlete_id: this.athleteDoc._id,
    laps: this.shouldAddExtraLap ? 1 : 0,
    segment_efforts: [],
    source: INGEST_SOURCE,
    start_date_local,
    startDateUtc: new Date(start_date),
    location: this.locationName,
  });

  /**
   * Generate stats for this location from prepared documents
   */
  generateStats() {
    // buildLocationsStatsFromActivities() can handle activites
    // with multiple locations.
    // In this case, all will have the same location EXCEPT
    // if we found a multi-location activity. Hence the filtering.
    const globalStats = buildLocationsStatsFromActivities(
      this.activityDocs.filter(
        ({ location }) => location === this.locationName,
      ),
    );
    this.stats = globalStats[this.locationName];
  }

  /**
   * Save stats for athleteDoc using v2 format
   */
  async saveStats() {
    const {
      locations: topLevelLocations,
      stats: prevStats,
    } = this.athleteDoc;

    this.athleteDoc.set({
      stats_version: 'v2',
      locations: _uniq([
        ...topLevelLocations,
        this.locationName,
      ]),
      stats: {
        ...prevStats,
        locations: {
          ...prevStats.locations,
          [this.locationName]: this.stats,
        },
      },
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
   * Get number of activities, for logging
   */
  getNumActivities = () => Object.keys(this.activities).length;

  /**
   * Get stats object for this segment, will be v2 format
   *
   * @return {Object}
   */
  getStats = () => this.stats;

  /**
   * Get Activity documents
   *
   * @return {Object}
   */
  getActivityDocs = () => this.activityDocs;

  /**
   * Get invalid activities
   *
   * @return {Array}
   */
  getInvalidActivities = () => this.invalidActivities;

  /**
   * Get array of IDs of invalid activities
   *
   * @return {Array}
   */
  getInvalidActivitiesIds = () => this.invalidActivities.map(
    ({ _id = 'unknown ID' }) => _id,
  );
}

module.exports = LocationIngest;
