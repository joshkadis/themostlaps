const {
  getEpochSecondsFromDateObj,
} = require('./athleteUtils');

test('getEpochSecondsFromDateObj', () => {
  const baseTimeString = '2018-04-08T12:59:14';
  const baseTimestamp = 1523192354;

  const dateUTC = new Date(`${baseTimeString}Z`);
  expect(getEpochSecondsFromDateObj(dateUTC)).toBe(baseTimestamp);

  const dateLocal = new Date(`${baseTimeString}-04:00`);
  const localTimestamp = baseTimestamp + (4 * 60 * 60);
  expect(getEpochSecondsFromDateObj(dateLocal)).toBe(localTimestamp);
});

