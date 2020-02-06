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
 * Create a custom single-use exception and send to Sentry
 *
 * @param {Error|String} err Error or string to create new Error
 * @param {String} source Adds 'source' tag
 * @param {Object} opts
 * @param {String} opts.level
 * @param {Object} opts.tags Expects key:value only
 * @param {Object} opts.extra Expects key:value only
 */
function captureSentry(err, source = null, opts = {}) {
  const msg = err instanceof Error ? err.message : err;
  const isDryRun = opts.tags && (opts.tags.dryRun || opts.tags.isDryRun);

  console.log(`
-----${isDryRun ? 'v DRY RUN v' : '-----------'}-----
Sentry: ${msg} | ${opts.level || 'error'}
${new Date().toISOString()}
Source: ${source || 'undefined'}
Tags: ${opts.tags ? JSON.stringify(opts.tags) : 'none'}
Extra: ${opts.extra ? JSON.stringify(opts.extra) : 'none'}
-----${isDryRun ? '^ DRY RUN ^' : '-----------'}-----`);

  Sentry.withScope((scope) => {
    // Set "source" tag
    if (source) {
      scope.setTag('source', source);
    }

    if (opts.level) {
      scope.setLevel(opts.level);
    }
    if (opts.tags) {
      Object.keys(opts.tags).forEach((key) => {
        scope.setTag(key, opts.tags[key]);
      });
    }
    if (opts.extra) {
      Object.keys(opts.extra).forEach((key) => {
        scope.setExtra(key, opts.extra[key]);
      });
    }

    Sentry.captureException(new Error(
      err instanceof Error
        ? err
        : new Error(err),
    ));
  });
}

module.exports = {
  sentryEnvironment,
  initSentry,
  captureSentry,
};
