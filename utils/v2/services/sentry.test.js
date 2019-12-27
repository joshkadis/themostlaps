const { sentryEnvironment } = require('./sentry');

process.env.SENTRY_ENV = process.env.SENTRY_ENV || 'jest';

test('sentryEnvironment', () => {
  expect(sentryEnvironment()).toEqual('jest');

  expect(sentryEnvironment({
    prefix: 'my',
    suffix: 'test',
  }))
    .toEqual('my-jest-test');

  expect(sentryEnvironment({
    prefix: 'my',
    envName: 'awesome',
    suffix: 'test',
  }))
    .toEqual('my-awesome-test');
});
