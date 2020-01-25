const { transformByYear } = require('./transformForRender');

test('transformByYear', () => {
  expect(transformByYear()).toStrictEqual([]);
  expect(transformByYear({})).toStrictEqual([]);

  // eslint-disable-next-line
  expect(transformByYear({ 2013: 4, '2014': 5 })).toStrictEqual([
    { year: 2013, value: 4 },
    { year: 2014, value: 5 },
  ]);

  expect(transformByYear({
    2013: 4,
    2017: 5,
    2018: 6,
    2020: 8,
  })).toStrictEqual([
    { year: 2013, value: 4 },
    { year: 2014, value: 0 },
    { year: 2015, value: 0 },
    { year: 2016, value: 0 },
    { year: 2017, value: 5 },
    { year: 2018, value: 6 },
    { year: 2019, value: 0 },
    { year: 2020, value: 8 },
  ]);
});
