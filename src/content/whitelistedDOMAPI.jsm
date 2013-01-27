/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let EXPORTED_SYMBOLS = [
  "whitelistedDOMAPI",
];

const { interfaces: Ci, classes: Cc } = Components;

var log;

/**
 * whitelistedDOMAPI emits events when it does stuff.  Use on() to listen for
 * events and off() to stop listening.  Event listener functions are called
 * like
 *
 *   listener(eventName, details).
 *
 * eventName is the name of the event, and details is an object whose properties
 * are particular to the type of event.
 *
 * So far there's only one type of event:
 *
 * didDefineProperty
 *   Emitted after a property is defined on a window.
 *   With details:
 *     window: The window the property was defined on.
 *     name: The name of the property.
 *     descriptor: The property descriptor.
 */

const whitelistedDOMAPI = {

  /**
   * Must be called first.
   *
   * @param logger  A Logger object.  Not expected to be null.
   */
  startup: function startup(logger) {
    if (this._propertyMap)
      // Already started up.
      return;
    log = logger;
    log.debug("whitelistedDOMAPI startup");
    this._propertyMap = {};
    this._listeners = {};
    Cc["@mozilla.org/observer-service;1"].
      getService(Ci.nsIObserverService).
      addObserver(this, "content-document-global-created", false);
  },

  /**
   * Must be called last.
   */
  shutdown: function shutdown() {
    log.debug("whitelistedDOMAPI shutdown");
    delete this._propertyMap;
    delete this._listeners;
    Cc["@mozilla.org/observer-service;1"].
      getService(Ci.nsIObserverService).
      removeObserver(this, "content-document-global-created");
  },

  /**
   * Like Object.defineProperty, but defines on all windows matching the given
   * origins.
   *
   * The property is defined on all matching, currently open content windows and
   * all matching content windows yet to be.  Definitions live as long as their
   * associated windows, which means they could outlive the caller; they are not
   * undefined at some later point.
   *
   * @param origins  An array of origins for which to define the property.  Each
   *                 origin is a scheme + host + optional port string, e.g.,
   *                 "http://www.mozilla.org", "http://www.mozilla.org:99".  Use
   *                 "*" to define for all origins.
   * @param name     The property's name.
   * @param desc     The property's descriptor.
   */
  defineProperty: function defineProperty(origins, name, desc) {
    // Design note: The reason this method accepts an array of origins rather
    // than a single origin is that it has to iterate over all content windows.
    // If the caller needs to define the property on multiple origins all at
    // once, it can do it in O(w) time; if this method took a single origin
    // instead, it would be O(o * w), w = number of content windows, o = number
    // of origins.
    let originMap = {};
    origins.forEach(function (origin) {
      this._propertyMap[origin] = { name: name, desc: desc };
      originMap[origin] = true;
    }, this);
    for (let win in allContentWindows())
      if (("*" in originMap) || (originFromWindow(win) in originMap))
        this._definePropertyOnWindow(win, name, desc);
  },

  /**
   * Adds an event listener.
   *
   * @param eventName  The name of the event to listen for.
   * @param callback   A function that will be called when the event occurs.
   *                   The arguments it's passed depend on the event.
   */
  on: function on(eventName, callback) {
    this._listeners[eventName] = this._listeners[eventName] || [];
    this._listeners[eventName].push(callback);
  },

  /**
   * Removes an event listener.
   *
   * @param eventName  The name of the event for which the listener was added.
   * @param callback   The listener function that was previously added.
   */
  off: function off(eventName, callback) {
    if (!(eventName in this._listeners))
      return;
    let idx = this._listeners[eventName].indexOf(callback);
    if (idx < 0)
      return;
    this._listeners[eventName].splice(idx, 1);
    if (!this._listeners[eventName].length)
      delete this._listeners[eventName];
  },

  observe: function observe(win, topic, origin) {
   // I'd prefer to implement nsIDOMGlobalPropertyInitializer instead of
   // observing content-document-global-created, but there's no way to hide
   // properties from nonwhitelisted pages: `myPropName in window` is always
   // true.  A deal breaker.
    log.debug("whitelistedDOMAPI observe origin=" + origin);
    let nameDesc = this._propertyMap[origin] || this._propertyMap["*"];
    if (nameDesc)
      this._definePropertyOnWindow(win, nameDesc.name, nameDesc.desc);
  },

  _definePropertyOnWindow: function _definePropertyOnWindow(win, name, desc) {
    log.debug("definePropertyOnWindow name=" + name +
              " url=" + win.document.documentURI);
    try {
      Object.defineProperty(XPCNativeWrapper.unwrap(win), name, desc);
    }
    catch (err) {
      // This can happen if the property already exists and isn't writable.  Not
      // clear what we should do.
      log.warn("Property not writable?", String(err));
      return;
    }
    this._emit("didDefineProperty",
               { window: win, name: name, descriptor: desc });
  },

  _emit: function _emit(eventName, details) {
    if (!(eventName in this._listeners))
      return;
    this._listeners[eventName].forEach(function (cb) cb(eventName, details));
  },
};

function originFromWindow(win) {
  let doc = win.document;
  if (!doc)
    return null;
  try {
    return doc.documentURIObject.prePath;
  }
  catch (err) {
    log.debug("originFromWindow failed, uri=" + (doc.documentURI || "(none)"),
              err);
  }
  return null;
}

function allContentWindows() {
  let browsers = Cc["@mozilla.org/appshell/window-mediator;1"].
                 getService(Ci.nsIWindowMediator).
                 getEnumerator("navigator:browser");
  while (browsers.hasMoreElements()) {
    let browserBrowsers = browsers.getNext().gBrowser.browsers;
    for (let i = 0; i < browserBrowsers.length; i++) {
      let contentWins =
        browserBrowsers[i].docShell.
        getDocShellEnumerator(Ci.nsIDocShellTreeItem.typeContent,
                              Ci.nsIDocShell.ENUMERATE_FORWARDS);
      while (contentWins.hasMoreElements())
        yield contentWins.getNext().
              QueryInterface(Ci.nsIInterfaceRequestor).
              getInterface(Ci.nsIDOMWindow);
    }
  }
}
