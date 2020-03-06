const {
  getPageTitle,
  getApiQueryPath,
} = require('./index');

test('getApiQueryPath', () => {
  expect(getApiQueryPath('single'))
    .toEqual('/v2/ranking/single');

  expect(getApiQueryPath('single', '12'))
    .toEqual('/v2/ranking/single');

  expect(getApiQueryPath('2009'))
    .toEqual('/v2/ranking/2009');

  expect(getApiQueryPath('2009', '11'))
    .toEqual('/v2/ranking/2009/11');
});

test('getPageTitle', () => {
  // Make sure the defined titles work
  expect(getPageTitle('allTime'))
    .toEqual('The Most Laps');

  expect(getPageTitle('alltime'))
    .toEqual('The Most Laps');

  expect(getPageTitle('what'))
    .toEqual('Laps');

  // Try some year-based titles
  expect(getPageTitle('2012'))
    .toEqual('Laps for 2012');

  expect(getPageTitle(2012, '01'))
    .toEqual('Laps for January 2012');

  expect(getPageTitle(2012, 1))
    .toEqual('Laps for January 2012');
});
