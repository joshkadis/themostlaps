const { getPathWithQueryString } = require('../utils');

test('getPathWithQueryString', () => {
  expect(getPathWithQueryString({
    pathname: '/test',
    query: { test: 'test' },
  }))
    .toEqual('/test?test=test');

  expect([
    '/test?test=test&autherror=40',
    '/test?autherror=40&test=test',
  ])
    .toContain(getPathWithQueryString({
      pathname: '/test',
      query: { test: 'test', autherror: 40 },
    }));
});
