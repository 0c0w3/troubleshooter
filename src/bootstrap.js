/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TroubleshootPropertyName = "mozTroubleshoot";

const WhitelistedOrigins = [
  "https://support.mozilla.org",
];

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

var log;

function startup(data, reason) {
  Cu.import("chrome://troubleshooter/content/logger.jsm");
  Cu.import("chrome://troubleshooter/content/whitelistedDOMAPI.jsm");

  let env = Cc["@mozilla.org/process/environment;1"].
            getService(Ci.nsIEnvironment);

  log = new logger.Logger("troubleshooter");
  let logLevelStr = env.get("TROUBLESHOOTER_LOG_LEVEL");
  if (logLevelStr) {
    let level = Number(logLevelStr);
    if (!isNaN(level))
      log.level = level;
  }
  log.debug("bootstrap.js startup reason=" + reason);
  log.debug("log level is " + log.level);

  let origins = WhitelistedOrigins.slice();
  let originStr = env.get("TROUBLESHOOTER_ORIGIN");
  if (originStr)
    origins.unshift.apply(origins, originStr.split(/\s+/));
  log.debug("whitelisted origins:", origins);

  try {
    Cu.import("resource://gre/modules/Troubleshoot.jsm");
  }
  catch (err) {
    // Troubleshoot.jsm didn't appear until Firefox 18.  Include a copy in the
    // add-on so people on earlier versions can use it.
    log.debug("falling back to bundled Troubleshoot.jsm");
    Cu.import("chrome://troubleshooter/content/Troubleshoot.jsm");
  }

  // Every property of every object passed from chrome to content has to be
  // explicitly exposed via __exposedProps__ for content to see it.  That means
  // the simple object passed to snapshot's callback.  That means all the nested
  // properties of that object that are themselves objects.
  //
  // Rather than try to perfectly reflect Troubleshoot's API to content and risk
  // running into crappy wrapper bugs, pass JSON to the snapshot caller; strings
  // don't need __exposedProps__.  If Troubleshoot grows more complex, it may be
  // worth writing IDL for it, which would remove the need for wrapping here.
  let troubleshootWrapper = {
    __exposedProps__: {},
    snapshotJSON: function snapshotJSON(done) {
      Troubleshoot.snapshot(function onSnap(data) done(JSON.stringify(data)));
    },
  };
  for (let prop in troubleshootWrapper)
    if (prop[0] != "_")
      troubleshootWrapper.__exposedProps__[prop] = "r";

  whitelistedDOMAPI.startup(log);
  whitelistedDOMAPI.defineProperty(origins, TroubleshootPropertyName,
                                   { value: troubleshootWrapper });
}

function shutdown(data, reason) {
  log.debug("bootstrap.js shutdown reason=" + reason);
  whitelistedDOMAPI.shutdown();
}

// Whatever it is that loads us warns if install isn't defined.
function install(data, reason) {}
function uninstall(data, reason) {}
