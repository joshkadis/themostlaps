const { defaultLocation } = require('../config');
const { allowedRankingTypes } = require('../api/apiConfig');
const { isValidLocation } = require('../utils/v2/locations');
const { isValidYear, isValidMonth } = require('../utils/dateTimeUtils');
/**
 * Validate reqPrimary and reqSecondary
 *
 * @param {String} params.location Pass true to automatically validate
 * @param {String} params.reqPrimary
 * @param {String} params.reqSecondary
 * @returns {Bool}
 */
function requestParamsAreValid({
  location = '',
  reqPrimary = '',
  reqSecondary = '',
}) {
  if (!isValidLocation(location, false) && location !== true) {
    return false;
  }
  if (!reqPrimary && !reqSecondary) {
    return true;
  }

  const primaryIsValidType = reqPrimary && reqPrimary.toString().match(
    new RegExp(`(${allowedRankingTypes.join('|')})`, 'i'),
  );

  const primaryIsValidYear = isValidYear(reqPrimary);
  const secondaryIsValidMonth = !reqSecondary || isValidMonth(reqSecondary);

  if (
    (primaryIsValidType && !reqSecondary) // /ranking/single
    || (primaryIsValidYear && secondaryIsValidMonth) // /ranking/2019 or /ranking/2019/10
  ) {
    return true;
  }
  return false;
}

/**
 * Handle requests for `ranking` routes
 */
function handleRankingRedirects(server, renderCallback) {
  server.get('/ranking', (req, res) => {
    res.redirect(301, `/ranking/${defaultLocation}`);
  });

  // single, alltime, activities, etc
  server.get(
    `/ranking/:type(${allowedRankingTypes.join('|')})`,
    (req, res) => {
      const { params: { type = '' } } = req;
      res.redirect(301, `/ranking/${defaultLocation}/${type}`);
    },
  );

  // year and optional month
  server.get(
    '/ranking/:year(\\d+)/:month?',
    (req, res) => {
      const { params } = req;
      // Validate month because regex not working with optional param
      if (!requestParamsAreValid({
        ...params,
        location: true,
      })) {
        res.statusCode = 404;
        renderCallback(req, res, '/_error', {});
        return;
      }
      res.redirect(
        301,
        `/ranking/${defaultLocation}/${params.year}/${params.month || ''}`,
      );
    },
  );
}

module.exports = {
  handleRankingRedirects,
  requestParamsAreValid,
};
