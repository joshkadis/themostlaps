const { parse } = require('query-string');

/**
 * Determine from Next Router if current route is v2
 *
 * @param {Router} router
 * @return {Bool}
 */
function routeIsV2(router = {}) {
  const { route = '', asPath = '' } = router;
  // Any *_v2 template is a v2 route
  if (/_v2$/.test(route)) {
    return true;
  }

  // Check for ?v2 query string param
  const parts = asPath.split('?');
  if (parts.length !== 2) {
    return false;
  }

  const params = parse(parts[1]);
  return typeof params.v2 !== 'undefined';
}

module.exports = {
  routeIsV2,
};
