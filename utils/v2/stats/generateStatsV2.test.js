const _cloneDeep = require('lodash/cloneDeep');
const { v2Stats } = require('./transformStats.test.data');
const {
  updateAllStatsFromActivity,
  applyActivityToLocationStats,
} = require('./generateStatsV2');

const PP_LAPS = 7;
const CP_LAPS = 4;

describe('adds, removes, updates stats from activity updateAllStatsFromActivity', () => {
  let activity;
  let expectedAthleteStats;
  const initialStats = _cloneDeep(v2Stats);
  beforeEach(() => {
    activity = {
      start_date_local: '2019-04-08T19:16:08Z',
      startDateUtc: new Date('2019-04-08T19:16:08Z'), // timezone doesn't matter here
      activityLocations: [
        {
          laps: PP_LAPS,
          location: 'prospectpark',
        },
        {
          laps: CP_LAPS,
          location: 'centralpark',
        },
      ],
    };
    expectedAthleteStats = _cloneDeep(v2Stats);
    // Add activity to expected prospectpark data
    expectedAthleteStats.locations.prospectpark.allTime += PP_LAPS;
    expectedAthleteStats.locations.prospectpark.numActivities += 1;
    expectedAthleteStats.locations.prospectpark.byYear['2019'] += PP_LAPS;
    expectedAthleteStats.locations.prospectpark.byMonth['2019'][3] += PP_LAPS;

    expectedAthleteStats.locations.centralpark = {
      allTime: CP_LAPS,
      single: CP_LAPS,
      numActivities: 1,
      availableYears: [2019],
      byYear: {
        2019: CP_LAPS,
      },
      byMonth: {
        2019: [
          0,
          0,
          0,
          CP_LAPS,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ],
      },
    };
  });

  test('applies positive laps to activity', () => {
    expect(applyActivityToLocationStats(
      {
        laps: PP_LAPS,
        start_date_local: '2019-04-08T19:16:08Z',
      },
      _cloneDeep(v2Stats.locations.prospectpark),
    ))
      .toStrictEqual(expectedAthleteStats.locations.prospectpark);
  });

  test('applies negative laps to location stats', () => {
    // Reduce to 0 by remove all laps exactly
    let cpStats = _cloneDeep(expectedAthleteStats.locations.centralpark);
    expect(applyActivityToLocationStats({
      laps: CP_LAPS * -1,
      start_date_local: '2019-04-08T19:16:08Z',
    }, cpStats))
      .toStrictEqual({
        allTime: 0,
        single: 0,
        numActivities: 0,
        availableYears: [],
        byYear: {},
        byMonth: {},
      });

    // Return existing object by trying to remove more laps than currently exist
    cpStats = _cloneDeep(expectedAthleteStats.locations.centralpark);
    expect(applyActivityToLocationStats({
      laps: (CP_LAPS + 10) * -1,
      start_date_local: '2019-04-08T19:16:08Z',
    }, cpStats))
      .toStrictEqual(cpStats);

    // Remove appropriate amount of laps from ORIGINAL stats import
    const ppStats = _cloneDeep(v2Stats.locations.prospectpark);
    const updatedStats = applyActivityToLocationStats({
      laps: -10,
      start_date_local: '2014-04-08T19:16:08Z',
    }, ppStats);
    expect(updatedStats.allTime).toEqual(2860);
    expect(updatedStats.numActivities).toEqual(476);
    expect(updatedStats.single).toEqual(14);
    expect(updatedStats.availableYears).toStrictEqual([
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
    ]);
    expect(updatedStats.byYear[2014]).toEqual(138);
    expect(updatedStats.byMonth[2014]).toStrictEqual([
      10,
      12,
      23,
      16,
      32,
      4,
      41,
      0,
      0,
      0,
      0,
      0,
    ]);
  });

  test('updates stats from multi-location activity', () => {
    expect(updateAllStatsFromActivity(activity, initialStats))
      .toStrictEqual(expectedAthleteStats);
  });
});
