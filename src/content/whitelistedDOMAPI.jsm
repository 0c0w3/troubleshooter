/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let EXPORTED_SYMBOLS = [
  "whitelistedDOMAPI",
];

const { interfaces: Ci, classes: Cc } = Components;

const whitelistedDOMAPI = {

  /**
   * Must be called first.
   *
   * @param log  A Logger object.  Not expected to be null.
   */
  startup: function startup(log) {
    if (this._propertyMap)
      // Already started up.
      return;
    this._log = log;
    this._log.debug("whitelistedDOMAPI startup");
    this._propertyMap = {};
    Cc["@mozilla.org/observer-service;1"].
      getService(Ci.nsIObserverService).
      addObserver(this, "content-document-global-created", false);
  },

  /**
   * Must be called last.
   */
  shutdown: function shutdown() {
    this._log.debug("whitelistedDOMAPI shutdown");
    delete this._propertyMap;
    Cc["@mozilla.org/observer-service;1"].
      getService(Ci.nsIObserverService).
      removeObserver(this, "content-document-global-created");
  },

  /**
   * Like Object.defineProperty, but defines on all windows matching the given
   * origin.
   *
   * @param origin  The origin for which to define the property.  A scheme +
   *                host, e.g., "http://www.mozilla.org".  Pass "*" to define
   *                for all origins.
   * @param name    The property's name.
   * @param desc    The property's descriptor.
   */
  defineProperty: function defineProperty(origin, name, desc) {
    this._log.debug("whitelistedDOMAPI defineProperty origin=" + origin);
    this._propertyMap[origin] = { name: name, desc: desc };
  },

  observe: function observe(window, topic, origin) {
    this._log.debug("whitelistedDOMAPI observe origin=" + origin);
    let nameDesc = this._propertyMap[origin] || this._propertyMap["*"];
    if (!nameDesc)
      return;
    this._log.debug("found property: " + nameDesc.name);
    let win = XPCNativeWrapper.unwrap(window);
    Object.defineProperty(win, nameDesc.name, nameDesc.desc);
  },
};
