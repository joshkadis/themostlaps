const {
  v1Stats,
  v2Stats,
} = require('./transformStats.test.data');
const { transformStats } = require('./transformStats');

test('transformStats', async () => {
  const transformed = await transformStats(v1Stats);
  transformed.locations.prospectpark.numActivities = 477;
  expect(transformed).toStrictEqual(v2Stats);
});
