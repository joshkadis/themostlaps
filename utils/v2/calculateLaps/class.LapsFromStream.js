const _isEmpty = require('lodash/isEmpty');
const { locations: allLocations } = require('../../../config');
const {
  getDistsToLocations,
  getCurrentLocation,
} = require('./utils');

// Padding around a waypoint that we'll count as having passed through it
const LAP_POINT_PADDING = 75;
// If an activity start point must be within this distance of a location
// or else we don't try to get laps for that location
const LOCATIONS_MAX_DISTANCE = 50000;

class LapsFromStream {
  locationsDists = {};

  closestLocation = '';

  currentLocation = '';

  streamIdx = 0;

  constructor(streams) {
    // Break StreamSet into disctinct data array
    streams.forEach((stream) => {
      const { type, data } = stream;
      this.streams[type] = data;
    });

    if (!this.streams.latlng || !this.streams.latlng.length) {
      throw new Error('StreamSet does not contain latlng points');
    }

    if (
      !this.streams.distance
      || !this.streams.time
      || this.streams.distance.length !== this.streams.latlng.length
      || this.streams.time.length !== this.streams.latlng.length
    ) {
      this.shouldUseLatlng = true;
    }

    this.locationsDists = getDistsToLocations(
      this.streams.latlng[0],
      allLocations,
      LOCATIONS_MAX_DISTANCE,
    );

    // Not close enough to any location to keep going
    if (_isEmpty(this.locationsDists)) {
      return false;
    }

    // In case activity starts on the loop itself
    this.currentLocation = getCurrentLocation(this.locationsDists);
    if (!this.currentLocation) {
      this.skipToCurrentLocation();
      // Not close enough to any location to keep going
      if (_isEmpty(this.locationsDists)) {
        return false;
      }
    } else {
      // make both are set
      this.closestLocation = this.currentLocation;
      // no reason to check 0 again
      this.streamIdx = 1;
    }
    return this;
  }

  /**
   * Iterante over streams.latlng until we find a location
   * to start counting laps
   */
  skipToCurrentLocation() {
    while (
      !this.currentLocation
      && this.streamIdx < this.streams.latlng.length
    ) {
      this.locationsDists = getDistsToLocations(
        this.streams.latlng[this.streamIdx],
        this.locationsDists,
        LOCATIONS_MAX_DISTANCE,
      );
      this.currentLocation = getCurrentLocation(this.locationsDists);
      this.streamIdx += 1;
    }
  }
}

module.exports = LapsFromStream;
