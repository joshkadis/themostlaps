const Sentry = require('@sentry/node');

/**
 * Get environment name for Sentry.io
 *
 * @param {Object} opts
 * @param {String} opts.prefix
 * @param {String} opts.envName
 * @param {String} opts.suffix
 */
function sentryEnvironment({
  prefix = '',
  envName = '',
  suffix = '',
} = {}) {
  const pre = prefix ? `${prefix}-` : '';
  const suf = suffix ? `-${suffix}` : '';
  const env = envName || process.env.SENTRY_ENV || process.env.NODE_ENV;
  return `${pre}${env}${suf}`;
}

/**
 * Initialize Sentry.io
 *
 * @param {Object} opts
 */
function initSentry(opts = {}) {
  Sentry.init({
    dsn: 'https://3c6d9973a72841b1996fa7e825bf2fd5@sentry.io/1857715',
    environment: sentryEnvironment(opts),
  });
}

module.exports = {
  sentryEnvironment,
  initSentry,
};
