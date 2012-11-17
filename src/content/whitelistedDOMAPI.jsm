/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let EXPORTED_SYMBOLS = [
  "whitelistedDOMAPI",
];

const { interfaces: Ci, classes: Cc } = Components;

var log;

// I'd prefer to implement nsIDOMGlobalPropertyInitializer instead of observing
// content-document-global-created, but there's no way to hide properties from
// nonwhitelisted pages: `myPropName in window` is always true.  A deal breaker.

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
        definePropertyOnWindow(win, name, desc);
  },

  observe: function observe(win, topic, origin) {
    log.debug("whitelistedDOMAPI observe origin=" + origin);
    let nameDesc = this._propertyMap[origin] || this._propertyMap["*"];
    if (nameDesc)
      definePropertyOnWindow(win, nameDesc.name, nameDesc.desc);
  },
};

function definePropertyOnWindow(win, name, desc) {
  log.debug("definePropertyOnWindow name=" + name + " url=" +
            win.document.documentURI);
  Object.defineProperty(XPCNativeWrapper.unwrap(win), name, desc);
}

function originFromWindow(win) {
  let doc = win.document;
  if (!doc)
    return null;
  let uriSpec = doc.documentURI;
  try {
    let uri = Cc["@mozilla.org/network/io-service;1"].
              getService(Ci.nsIIOService).
              newURI(uriSpec, null, null);
    return uri.scheme + "://" + uri.hostPort;
  }
  catch (err) {
    log.debug("originFromWindow failed, uri=" + (uriSpec || "(none)"), err);
  }
  return null;
}

function allContentWindows() {
  let browsers = Cc["@mozilla.org/appshell/window-mediator;1"].
                 getService(Ci.nsIWindowMediator).
                 getEnumerator("navigator:browser");
  while (browsers.hasMoreElements()) {
    let contentWins = browsers.getNext().
                      QueryInterface(Ci.nsIInterfaceRequestor).
                      getInterface(Ci.nsIDocShell).
                      getDocShellEnumerator(Ci.nsIDocShellTreeItem.typeContent,
                                            Ci.nsIDocShell.ENUMERATE_FORWARDS);
    while (contentWins.hasMoreElements())
      yield contentWins.getNext().
            QueryInterface(Ci.nsIInterfaceRequestor).
            getInterface(Ci.nsIDOMWindow);
  }
}
