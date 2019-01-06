const { gqlQuery } = require('../gqlQueries');
const { processBatches } = require('../helpers');
const Condition = require('../../schema/Condition');

BATCH_SIZE = 500;

const getConditionQuery = (data) =>
`mutation {
  createCondition (
    data: {
      apparent_temperature: ${data.apparentTemperature}
      humidity: ${data.humidity}
      icon: "${data.icon}"
      precip_intensity: ${data.precipIntensity}
      precip_type: "${data.precipType}"
      source_activity: {
        connect: {
          strava_id: ${data.sourceActivity}
        }
      }
      summary: "${data.summary}"
      sunrise_time: ${data.sunriseTime}
      sunset_time: ${data.sunsetTime}
      temperature: ${data.temperature}
      timestamp: ${data.time}
      wind_speed: ${data.windSpeed}
      wind_gust: ${data.windGust}
    }
  ) {
    timestamp
    apparent_temperature
  }
}`;

async function processDocument(condition, force) {
  const mutation = getConditionQuery(condition.toJSON());
  const { createCondition } = await gqlQuery(mutation);
}

async function migrateConditions(force) {
  await processBatches(Condition, processDocument, BATCH_SIZE, force);
  process.exit(0);
}

module.exports = migrateConditions;
