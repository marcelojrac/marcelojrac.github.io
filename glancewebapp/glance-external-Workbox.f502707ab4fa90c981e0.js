/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(self, function() {
return (self["webpackChunkglance"] = self["webpackChunkglance"] || []).push([["glance-external-Workbox"],{

/***/ "./externals/Workbox/index.js":
/*!************************************!*\
  !*** ./externals/Workbox/index.js ***!
  \************************************/
/***/ (function() {

eval("if ('serviceWorker' in navigator && document.location.protocol !== 'http:') {\n  window.addEventListener('load', () => {\n    navigator.serviceWorker.register('./serviceWorker.js').then(registration => {\n      console.log('Workbox service worker successful with scope:', registration.scope);\n    }).catch(error => {\n      console.error('Workbox service worker failed to register', error);\n    });\n  });\n}\n\n//# sourceURL=webpack://glance/./externals/Workbox/index.js?");

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ var __webpack_exports__ = (__webpack_exec__("./externals/Workbox/index.js"));
/******/ return __webpack_exports__;
/******/ }
]);
});