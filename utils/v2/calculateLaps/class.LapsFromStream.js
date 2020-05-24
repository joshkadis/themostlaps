const {
  getDistance,
} = require('geolib');
const { locations } = require('../../../config');

const LAP_POINT_PADDING = 75;

class LapsFromStream {
  laps = 0;

  location = {};

  streams = {};

  shouldUseLatlng = false;

  constructor(streams, locName) {
    if (!locations[locName]) {
      throw new Error(`Unknown location: ${locName}`);
    }

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
      || !this.streams.distance.length
      || this.streams.distance.length !== this.streams.latlng.length
    ) {
      this.shouldUseLatlng = true;
    }
  }

  calculate() {
    if (this.shouldUseLatlng) {
      this.calculateFromLatLng();
      return;
    }

    // If we get this far, we know we have a latlng stream and
    // a distance stream and they are the same size
    const points = [...this.streams.latlng];
    const dists = [...this.streams.distance];
    const numPoints = this.streams.latlng.length;
    const {
      locationCenter: center,
      maxLapRadius: maxRad,
    } = { ...this.location };

    // If we start 5000m from center and maxRad is 1500m
    // Must travel at least 3500m before starting first lap
    const minDistanceToPerimeter = getDistance(points[0], center, 100) - maxRad;

    for (let idx = 0; idx < numPoints; idx += 1) {
      // No geolib functions are necessary until we reach
      // the perimeter of the loop
      if (dists[idx] < minDistanceToPerimeter) {
        return;
      }
      const currentPoint = points[idx];

      // If no start point set, Loop through lap points
      // If current point is near one, mark it as start point
      // and set up array of points to be completed in order to count a lap
      // then continue

      // If



    }
  }
}

module.exports = LapsFromStream;
