/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { interfaces: Ci, classes: Cc, results: Cr, utils: Cu } = Components;


var log;

// let main = {};

// function startup(data, reason) {
// //   let logger = {};
// //   Cu.import("chrome://troubleshooting-data-helper/content/logger.jsm", logger);
// //   log = new logger.Logger("troubleshooting-data-helper");
// //   log.level = logger.Logger.level.DEBUG;
// //   log.debug("bootstrap startup");

//   Cu.import("chrome://troubleshooting-data-helper/content/main.jsm", main);
//   main.start();
// }


// Cu.import("resource://gre/modules/XPCOMUtils.jsm");
// function Troubleshoot() {
// }
// Troubleshoot.prototype = {
//   init: function init(window) {
//     dump("******************************************************* init\n");
// //     return { foo: "foo!" };
//     Cu.import("resource://gre/modules/Services.jsm");
//     return {
//       snapshot: function (cb) {
//         Services.tm.mainThread.dispatch(cb.bind(null, "hey!"),
//                                         Ci.nsIThread.DISPATCH_NORMAL);
//       },
//     };
//   },
//   classID: Components.ID("{0ddbb0a6-9f1e-4c69-b8c3-8e57ed2679cf}"),
//   QueryInterface: XPCOMUtils.generateQI([
//     Ci.nsIDOMGlobalPropertyInitializer,
//     Ci.nsISupports,
//   ]),
// };
// let Factory = {
//   createInstance: function (outer, iid) {
//     if (outer != null)
//       throw Cr.NS_ERROR_NO_AGGREGATION;
//     return new Troubleshoot();
//   }
// };

// Cu.import("resource://gre/modules/XPCOMUtils.jsm");
// function DOMAPIInitializer() {
// }
// DOMAPIInitializer.prototype = {
//   init: function init(window) {
//     dump("*********** init\n");
//     log.debug("DOMAPIInitializer init");
//     Cu.import("resource://gre/modules/Services.jsm");
//     return {
//       snapshot: function (cb) {
//         Services.tm.mainThread.dispatch(cb.bind(null, "hey!"),
//                                         Ci.nsIThread.DISPATCH_NORMAL);
//       },
//     };
//   },
//   classID: Components.ID("{0ddbb0a6-9f1e-4c69-b8c3-8e57ed2679cf}"),
//   QueryInterface: XPCOMUtils.generateQI([
//     Ci.nsIDOMGlobalPropertyInitializer,
//     Ci.nsISupports,
//   ]),
// };
// const DOMAPIInitializerFactory = {
//   createInstance: function createInstance(outer, iid) {
//     dump("*********** createInstance\n");
//     if (outer)
//       throw Cr.NS_ERROR_NO_AGGREGATION;
//     return new DOMAPIInitializer();
//   }
// };

// function startup(data, reason) {
//   Cu.import("chrome://troubleshooting-data-helper/content/logger.jsm");
//   log = new logger.Logger("troubleshooting-data-helper");
//   log.level = logger.Logger.level.DEBUG;
//   log.debug("bootstrap startup");
// //   Components.manager.QueryInterface(Ci.nsIComponentRegistrar).
// //     registerFactory(Troubleshoot.prototype.classID, "TroubleshootDOMAPIXXX",
// //                     "@mozilla.org/troubleshooting-dom-api;1", Factory);
//   Components.manager.QueryInterface(Ci.nsIComponentRegistrar).
//     registerFactory(DOMAPIInitializer.prototype.classID, "TroubleshootDOMAPIInitializer",
//                     "@mozilla.org/troubleshooting-dom-api;1", DOMAPIInitializerFactory);
//   Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager).
//     addCategoryEntry("JavaScript-global-property", "mozTroubleshoot", "@mozilla.org/troubleshooting-dom-api;1", false, true);
// }


// function shutdown(data, reason) {
//   log.debug("bootstrap shutdown");
//   log = null;

// //   main.shutdown();
// //   main = null;
// }



// Cu.import("chrome://troubleshooting-data-helper/content/logger.jsm");
// Cu.import("chrome://troubleshooting-data-helper/content/domAPI.jsm");



// Cu.import("resource://gre/modules/XPCOMUtils.jsm");
// function DOMAPIInitializer() {
// }
// DOMAPIInitializer.prototype = {
//   init: function init(window) {
//     dump("*********** init\n");
//     log.debug("DOMAPIInitializer init");
//     Cu.import("resource://gre/modules/Services.jsm");
//     return {
//       snapshot: function (cb) {
//         Services.tm.mainThread.dispatch(cb.bind(null, "hey!"),
//                                         Ci.nsIThread.DISPATCH_NORMAL);
//       },
//     };
//   },
//   classID: Components.ID("{0ddbb0a6-9f1e-4c69-b8c3-8e57ed2679cf}"),
//   QueryInterface: XPCOMUtils.generateQI([
//     Ci.nsIDOMGlobalPropertyInitializer,
//     Ci.nsISupports,
//   ]),
// };
// const DOMAPIInitializerFactory = {
//   createInstance: function createInstance(outer, iid) {
//     dump("*********** createInstance\n");
//     if (outer)
//       throw Cr.NS_ERROR_NO_AGGREGATION;
//     return new DOMAPIInitializer();
//   }
// };


function startup(data, reason) {
  Cu.import("chrome://troubleshooting-data-helper/content/logger.jsm");
  Cu.import("chrome://troubleshooting-data-helper/content/domAPI.jsm");
  log = new logger.Logger("troubleshooting-data-helper");
  log.level = logger.Logger.level.DEBUG;//XXX check env var instead
  log.debug("bootstrap.js startup, reason=" + reason);
  domAPI.startup(log);
}

function shutdown(data, reason) {
  log.debug("bootstrap.js shutdown, reason=" + reason);
  domAPI.shutdown();
}





// function install(data, reason) {
//   dump("bootstrap install\n");
// }

// function uninstall(data, reason) {
//   dump("bootstrap uninstall\n");
// }
