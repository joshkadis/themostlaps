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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
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
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(5);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// EXTERNAL MODULE: external "react"
var external__react_ = __webpack_require__(0);
var external__react__default = /*#__PURE__*/__webpack_require__.n(external__react_);

// EXTERNAL MODULE: external "next/link"
var link_ = __webpack_require__(2);
var link__default = /*#__PURE__*/__webpack_require__.n(link_);

// EXTERNAL MODULE: external "next/head"
var head_ = __webpack_require__(6);
var head__default = /*#__PURE__*/__webpack_require__.n(head_);

// CONCATENATED MODULE: ./components/Navigation.js

/* harmony default export */ var Navigation = (function () {
  return external__react__default.a.createElement(
    "nav",
    null,
    "blah blah blah"
  );
});
// CONCATENATED MODULE: ./components/Header.js



/* harmony default export */ var Header = (function () {
  return external__react__default.a.createElement(
    'header',
    null,
    external__react__default.a.createElement(
      'span',
      null,
      'LOGO'
    ),
    external__react__default.a.createElement(Navigation, null)
  );
});
// CONCATENATED MODULE: ./components/Footer.js

/* harmony default export */ var Footer = (function () {
  return external__react__default.a.createElement(
    "footer",
    null,
    "\xA9 2018 Josh Kadis"
  );
});
// EXTERNAL MODULE: ./components/Layout.css
var Layout = __webpack_require__(7);
var Layout_default = /*#__PURE__*/__webpack_require__.n(Layout);

// CONCATENATED MODULE: ./components/Layout.js






/**
 * Page layout
 */
/* harmony default export */ var components_Layout = (function (_ref) {
  var children = _ref.children;
  return external__react__default.a.createElement(
    'div',
    null,
    external__react__default.a.createElement(
      head__default.a,
      null,
      external__react__default.a.createElement('link', { rel: 'stylesheet', href: '/_next/static/style.css' })
    ),
    external__react__default.a.createElement(Header, null),
    external__react__default.a.createElement(
      'div',
      { className: Layout["main"] },
      children
    ),
    external__react__default.a.createElement(Footer, null)
  );
});
// EXTERNAL MODULE: ./config.js
var config = __webpack_require__(1);
var config_default = /*#__PURE__*/__webpack_require__.n(config);

// EXTERNAL MODULE: ./utils/envUtils.js
var envUtils = __webpack_require__(3);

// CONCATENATED MODULE: ./pages/index.js






function getSignupLinkUrl() {
  var params = ['client_id=' + config["stravaClientId"], 'response_type=code', 'scope=view_private', 'redirect_uri=' + encodeURIComponent(Object(envUtils["a" /* getEnvOrigin */])() + '/auth-callback'), 'state=signup'];

  return 'https://www.strava.com/oauth/authorize?' + params.join('&');
}

/* harmony default export */ var pages = __webpack_exports__["default"] = (function () {
  return external__react__default.a.createElement(
    components_Layout,
    null,
    external__react__default.a.createElement(
      'p',
      null,
      external__react__default.a.createElement(
        link__default.a,
        { as: '/prospectpark', href: '/park?segment=' + config["lapSegmentId"] },
        external__react__default.a.createElement(
          'a',
          null,
          'Prospect Park'
        )
      )
    ),
    external__react__default.a.createElement(
      'p',
      null,
      external__react__default.a.createElement(
        'a',
        { href: getSignupLinkUrl() },
        'Sign Up'
      )
    )
  );
});

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("next/head");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = {
	"main": "hHHtyqfFxVJZVAe-Vez1Q"
};

/***/ })
/******/ ]);