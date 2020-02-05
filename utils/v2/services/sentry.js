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

/**
 * Create a custom single-use exception and sednd to Sentry
 *
 * @param {String} message
 * @param {Object} opts
 * @param {Array} opts.tags
 * @param {String} opts.level
 * @param {Object} opts.extra
 */
function captureSentry(msg, opts = {}) {
  Sentry.withScope((scope) => {
    if (opts.tags) {
      scope.setTag(opts.tags);
    }
    if (opts.level) {
      scope.setLevel(opts.level);
    }
    if (opts.extra) {
      scope.setExtra(opts.level);
    }

    // Other options?
    Sentry.captureException(new Error(msg));
  });
}

module.exports = {
  sentryEnvironment,
  initSentry,
  captureSentry,
};
