module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete installedModules[moduleId];
/******/ 		}
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("react");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = {
  apiUrl: 'https://www.strava.com/api/v3',
  parkCenter: {
    latitude: 40.661990,
    longitude: -73.969681
  },
  allowedRadius: 50000,
  minDistance: 3300,
  addMakeupLap: true, // Avoids excess API calls when ingesting new user
  devFetchActivities: 10,
  lapSegmentId: 5313629, // Prospect Park Race Lap
  sectionSegmentIds: [613198, // Prospect Park hill
  4435603, // Top of Prospect Park
  4362776, // Prospect Pure Downhill
  9699985, // Sprint between the lights
  740668],
  prodDomain: 'themostlaps.herokuapp.com',
  stravaClientId: 22415
};

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("next/link");

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export isProduction */
/* harmony export (immutable) */ __webpack_exports__["a"] = getEnvOrigin;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__config__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__config___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__config__);


function isProduction() {
  if ('undefined' !== typeof window && window.location) {
    return __WEBPACK_IMPORTED_MODULE_0__config__["prodDomain"] === window.location.host;
  }

  return 'production' === "production";
}

function getEnvOrigin() {
  if ('undefined' !== typeof window && window.location) {
    return window.location.origin;
  }

  return isProduction() ? 'https://' + __WEBPACK_IMPORTED_MODULE_0__config__["prodDomain"] : 'http://localhost:' + process.env.PORT;
};

/***/ }),
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(9);


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_react__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_isomorphic_unfetch__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_isomorphic_unfetch___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_isomorphic_unfetch__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_next_link__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_next_link___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_next_link__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__utils_envUtils__ = __webpack_require__(3);



function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }





var Park = function Park(_ref) {
  var allTime = _ref.allTime;
  return __WEBPACK_IMPORTED_MODULE_1_react___default.a.createElement(
    'div',
    null,
    __WEBPACK_IMPORTED_MODULE_1_react___default.a.createElement(
      'h1',
      null,
      'All Time Ranking'
    ),
    allTime.map(function (_ref2) {
      var _id = _ref2._id,
          athlete = _ref2.athlete,
          stats = _ref2.stats;
      return __WEBPACK_IMPORTED_MODULE_1_react___default.a.createElement(
        'p',
        { key: _id },
        athlete.firstname + ' ' + athlete.lastname + ': ' + stats.allTime + ' laps'
      );
    }),
    __WEBPACK_IMPORTED_MODULE_1_react___default.a.createElement(
      __WEBPACK_IMPORTED_MODULE_3_next_link___default.a,
      { href: '/' },
      __WEBPACK_IMPORTED_MODULE_1_react___default.a.createElement(
        'a',
        null,
        'Home'
      )
    )
  );
};

Park.getInitialProps = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/__WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default.a.mark(function _callee(context) {
    var response, ranking;
    return __WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(!context.query.segment || isNaN(context.query.segment))) {
              _context.next = 2;
              break;
            }

            return _context.abrupt('return', { allTime: [] });

          case 2:
            _context.next = 4;
            return __WEBPACK_IMPORTED_MODULE_2_isomorphic_unfetch___default()(Object(__WEBPACK_IMPORTED_MODULE_4__utils_envUtils__["a" /* getEnvOrigin */])() + '/api/ranking/allTime/' + context.query.segment);

          case 4:
            response = _context.sent;
            _context.next = 7;
            return response.json();

          case 7:
            ranking = _context.sent;
            return _context.abrupt('return', {
              allTime: !ranking.error ? ranking.ranking : []
            });

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function (_x) {
    return _ref3.apply(this, arguments);
  };
}();

/* harmony default export */ __webpack_exports__["default"] = (Park);

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("babel-runtime/regenerator");

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("isomorphic-unfetch");

/***/ })
/******/ ]);