const { getPageTitle } = require('./index');

test('getPageTitle', () => {
  // Make sure the defined titles work
  expect(getPageTitle('allTime'))
    .toEqual('The Most Laps');
  expect(getPageTitle('what'))
    .toEqual('Laps');

  // Try some year-based titles
  expect(getPageTitle('2012'))
    .toEqual('2012');

  expect(getPageTitle(2012, '01'))
    .toEqual('January 2012');

  expect(getPageTitle(2012, 1))
    .toEqual('January 2012');
});
