const {
  v1Stats,
  v2Stats,
} = require('./transformStats.test.data');
const { transformStats } = require('./transformStats');

test('transformStats', async () => {
  // avoids database call in getNumActivities
  // by not passing athlete ID
  const transformed = await transformStats(v1Stats);
  transformed.locations.prospectpark.numActivities = 477;
  expect(transformed).toStrictEqual(v2Stats);
});
