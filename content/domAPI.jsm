/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let EXPORTED_SYMBOLS = [
  "domAPI",
];

const { interfaces: Ci, classes: Cc, utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const domAPI = {

  startup: function startup(log) {
    this._log = log;
    this._log.debug("domAPI startup");

    this._factory = {
      createInstance: function createInstance(outer, iid) {
        if (outer)
          throw Cr.NS_ERROR_NO_AGGREGATION;
        // There's no reason to create a new Initializer per window, so don't.
        // Don't be wasteful.
        if (!this._initializer)
          this._initializer = new Initializer(log);
        return this._initializer;
      },
    };

    Components.manager.QueryInterface(Ci.nsIComponentRegistrar).
      registerFactory(Initializer.prototype.classID,
                      "TroubleshootDOMAPIInitializer",
                      Initializer.prototype.contractID, this._factory);
    Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager).
      addCategoryEntry("JavaScript-global-property", "mozTroubleshoot",
                       Initializer.prototype.contractID, false, true);
  },

  shutdown: function shutdown() {
    this._log.debug("domAPI shutdown");
    Components.manager.QueryInterface(Ci.nsIComponentRegistrar).
      unregisterFactory(Initializer.prototype.classID, this._factory);
    Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager).
      deleteCategoryEntry("JavaScript-global-property", "mozTroubleshoot",
                          false);
  },
};

function Initializer(log) {
  this._log = log;
  this._log.debug("Initializer");
}

Initializer.prototype = {

  //XXX this is no good: it's always the case that ("mozTroubleshoot" in
  // window), even on nonwhitelisted sites.
  init: function init(window) {
//     throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
//     return null;
//     return window;
//     return Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
//     let sb = Components.utils.Sandbox("http://www.example.com/");
//     return sb;
//     let o = Components.utils.createObjectIn(null);
//     return o;

    // Uncaught exceptions are silently eaten. :(
    try {
      let uri = window.document.documentURI;
      this._log.debug("Initializer init, window URI=" + uri);
//       let win = XPCNativeWrapper.unwrap(aWindow);

      Cu.import("resource://gre/modules/Troubleshoot.jsm");

      // There's no need to return a new object per window since windows can't
      // modify the returned object or its properties (except where allowed, but
      // Troubleshoot currently doesn't have any mutable properties).
      if (!this._out) {
        this._out = { __exposedProps__: {} };
        for (let prop in Troubleshoot) {
          this._log.debug("attaching property to returned object: " + prop);
          this._out[prop] = Troubleshoot[prop];
          this._out.__exposedProps__[prop] = "r";
        }
      }
      return this._out;
    }
    catch (err) {
      this._log.error(err);
    }
    return null;
  },

  classID: Components.ID("{0ddbb0a6-9f1e-4c69-b8c3-8e57ed2679cf}"),
  contractID: "@mozilla.org/troubleshooting-dom-api;1",
  QueryInterface: XPCOMUtils.generateQI([
    Ci.nsIDOMGlobalPropertyInitializer,
    Ci.nsISupports,
  ]),
};
