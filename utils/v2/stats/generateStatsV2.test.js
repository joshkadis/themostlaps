const _cloneDeep = require('lodash/cloneDeep');
const { v2Stats } = require('./transformStats.test.data');
const { updateAllStatsFromActivity } = require('./generateStatsV2');

const PP_LAPS = 7;
const CP_LAPS = 4;

describe('updateAllStatsFromActivity', () => {
  let activity;
  let expectedAthleteStats;
  const initialStats = _cloneDeep(v2Stats);
  beforeEach(() => {
    activity = {
      start_date_local: '2019-04-08T19:16:08Z',
      startDateUtc: new Date('2019-04-08T19:16:08Z'), // timezone doesn't matter here
      secondaryLocations: [
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
  test('updates stats from multi-location activity', () => {
    expect(updateAllStatsFromActivity(activity, initialStats))
      .toStrictEqual(expectedAthleteStats);
  });
});
