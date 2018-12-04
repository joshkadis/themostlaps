const mongoose = require('mongoose');
const Mixed = mongoose.Schema.Types.Mixed;
const Schema = mongoose.Schema;

// DarkSky Data Point schema
// https://darksky.net/dev/docs#data-point
const conditionSchema = new Schema({
  apparentTemperature: Number,
  humidity: Number,
  icon: String,
  precipIntensity: Number,
  precipType: String,
  sourceActivity: { type: Number, required: true },
  summary: String,
  sunriseTime: Number,
  sunsetTime: Number,
  temperature: { type: Number, required: true },
  time: { type: Number, required: true },
  windSpeed: Number,
  windGust: Number,
});

const Condition = mongoose.model('Condition', conditionSchema);

module.exports = Condition;
