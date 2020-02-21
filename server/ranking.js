const { defaultLocation } = require('../config');
const { allowedRankingTypes } = require('../api/apiConfig');
const { getLocationNames } = require('../utils/v2/locations');

const locationsReStr = getLocationNames().join('|');
const yearReStr = '(?:20[12]\\d)';

/**
 * Validate reqPrimary and reqSecondary
 *
 * @param {String} params.reqPrimary
 * @param {String} params.reqSecondary
 * @returns {Bool}
 */
function requestParamsAreValid({ reqPrimary = '', reqSecondary = '' }) {
  const primaryIsValidType = reqPrimary && reqPrimary.match(
    new RegExp(`(${allowedRankingTypes.join('|')}`),
  );
  const primaryIsValidYear = reqPrimary && reqPrimary.match(
    /(?:20[12]\d)/,
  );
  const secondaryIsValidMonth = !reqSecondary || reqSecondary.match(
    /(?:(?:0\d)|1[0-2])/,
  );

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
function handleRankingRoute(server, renderCallback) {
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
    `/ranking/:year(${yearReStr})/:month?`,
    (req, res) => {
      const { params: { year, month = '' } } = req;
      // Validate month because regex not working with optional param
      if (month && !/(?:(?:0\d)|1[0-2])/.test(month)) {
        // 404
        return;
      }
      res.redirect(301, `/ranking/${defaultLocation}/${year}/${month}`);
    },
  );

  server.get(
    `/ranking/:location(${locationsReStr})/:reqPrimary?/:reqSecondary?`,
    (req, res) => {
      const { params } = req;
      if (!requestParamsAreValid(params)) {
        // 404
        return;
      }

      renderCallback(req, res, '/ranking_v2', {
        query: req.query,
        params: req.params,
      });
    },
  );
}

module.exports = handleRankingRoute;
