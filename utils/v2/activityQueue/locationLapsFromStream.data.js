/* eslint-disable */
const streams = require('./locationLapsFromStream.rawData.json');
const latlngData = streams[0].data;
const distance = streams[1].data;
const time = streams[2].data;
const geoCoords = latlngData.map(([lat, lon]) => ({ lat, lon }));

module.exports = {
  streams,
  latlngData,
  distance,
  time,
  geoCoords,
};
