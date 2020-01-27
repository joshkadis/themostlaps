const {
  getDefaultV2Stats,
  getDefaultLocationStats,
} = require('./utils');

describe('default stats getters return new objects', () => {
  test('defaultV2Stats', () => {
    const stats = getDefaultV2Stats();
    expect(stats.byYear).toEqual({});

    stats.byYear['2020'] = 10;
    expect(stats.byYear[2020]).toEqual(10);

    const stats2 = getDefaultV2Stats();
    expect(stats2.byYear).toEqual({});

    stats2.byYear['2020'] = 20;
    expect(stats2.byYear[2020]).toEqual(20);
    expect(stats.byYear[2020]).toEqual(10);

    const stats3 = getDefaultV2Stats({
      byYear: { 2020: 1 },
      something: 'else',
    });
    expect(stats3.byYear[2020]).toEqual(1);
    expect(stats3.something).toEqual('else');
  });

  test('getDefaultLocationStats', () => {
    const stats = getDefaultLocationStats();
    expect(stats.byYear).toEqual({});

    stats.byYear['2020'] = 10;
    expect(stats.byYear[2020]).toEqual(10);

    const stats2 = getDefaultLocationStats();
    expect(stats2.byYear).toEqual({});

    stats2.byYear['2020'] = 20;
    expect(stats2.byYear[2020]).toEqual(20);
    expect(stats.byYear[2020]).toEqual(10);

    const stats3 = getDefaultLocationStats({
      byYear: { 2020: 1 },
      something: 'else',
    });
    expect(stats3.byYear[2020]).toEqual(1);
    expect(stats3.something).toEqual('else');
  });
});
