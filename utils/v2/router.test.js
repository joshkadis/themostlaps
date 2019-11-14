const { routeIsV2 } = require('./router');

test('routeIsV2', () => {
  expect(routeIsV2()).toBe(false);

  expect(routeIsV2({
    asPath: 'nope?yep=maybe',
  })).toBe(false);

  expect(routeIsV2({
    route: 'test',
  })).toBe(false);

  expect(routeIsV2({
    route: 'test',
    asPath: 'nope?yep=maybe',
  })).toBe(false);

  expect(routeIsV2({
    route: 'test_v2',
    asPath: 'nope?yep=maybe',
  })).toBe(true);

  expect(routeIsV2({
    route: 'test',
    asPath: 'nope?yep=maybe&v2',
  })).toBe(true);

  expect(routeIsV2({
    route: 'test',
    asPath: 'nope?v2&foo=bar',
  })).toBe(true);
});
