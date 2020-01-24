const Athlete = require('../../../schema/Athlete');
const {
  updateAthletStatsFromActivityV1,
} = require('./athleteStatsV1');

test('updateAthletStatsFromActivityV1()', () => {
  const defaultStats = {
    allTime: 10,
    _2018: 10,
    _2018_01: 10,
  };

  const athlete = new Athlete({
    stats: { ...defaultStats },
  });

  updateAthletStatsFromActivityV1(athlete, 5, '2018-01-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 15,
    _2018: 15,
    _2018_01: 15,
  });
  athlete.set({ stats: { ...defaultStats } });

  updateAthletStatsFromActivityV1(athlete, 5, '2018-03-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 15,
    _2018: 15,
    _2018_01: 10,
  });
  athlete.set({ stats: { ...defaultStats } });

  updateAthletStatsFromActivityV1(athlete, -5, '2018-01-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 5,
    _2018: 5,
    _2018_01: 5,
  });

  updateAthletStatsFromActivityV1(athlete, 2, '2018-01-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 7,
    _2018: 7,
    _2018_01: 7,
  });

  athlete.set({ stats: { ...defaultStats } });
  updateAthletStatsFromActivityV1(athlete, -5, '2018-03-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 5,
    _2018: 5,
    _2018_01: 10, // edge case where _2018_03 isn't already set
  });
});
