const shouldSubscribe = require('./shouldSubscribe');

test('shouldSubscribe()', () => {
  expect(shouldSubscribe({ state: false })).toBe(false);
  expect(shouldSubscribe({ state: '' })).toBe(false);
  expect(shouldSubscribe({ state: '/about|' })).toBe(false);
  expect(shouldSubscribe({ state: '/about|shouldSubscribe' })).toBe(true);
});