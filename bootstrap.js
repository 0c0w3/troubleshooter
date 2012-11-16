/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TroubleshootPropertyName = "mozTroubleshoot";

const WhitelistedOrigins = [
  "http://support.mozilla.org",
  "https://support.mozilla.org",
  "http://input.mozilla.org",
  "https://input.mozilla.org",
  "http://www.mozilla.org",
  "https://www.mozilla.org",
];

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/Troubleshoot.jsm");

var log;

function startup(data, reason) {
  Cu.import("chrome://troubleshooting-data-helper/content/logger.jsm");
  Cu.import("chrome://troubleshooting-data-helper/content/" +
            "whitelistedDOMAPI.jsm");

  log = new logger.Logger("troubleshooting-data-helper");
  let logLevelStr = Cc["@mozilla.org/process/environment;1"].
                    getService(Ci.nsIEnvironment).
                    get("MOZ_TROUBLESHOOT_HELPER_LOG_LEVEL");
  if (logLevelStr) {
    let level = Number(logLevelStr);
    if (!isNaN(level))
      log.level = level;
  }
  log.debug("bootstrap.js startup, reason=" + reason);

  let troubleshootWrapper = { __exposedProps__: {} };
  for (let prop in Troubleshoot) {
    log.debug("adding property to Troubleshoot wrapper: " + prop);
    troubleshootWrapper[prop] = Troubleshoot[prop];
    troubleshootWrapper.__exposedProps__[prop] = "r";
  }
  let desc = { value: troubleshootWrapper };
  whitelistedDOMAPI.startup(log);
  WhitelistedOrigins.forEach(function (origin) {
    whitelistedDOMAPI.defineProperty(origin, "mozTroubleshoot", desc);
  });
}

function shutdown(data, reason) {
  log.debug("bootstrap.js shutdown, reason=" + reason);
  whitelistedDOMAPI.shutdown();
}

// Whatever it is that loads us warns if install isn't defined.
function install(data, reason) {}
function uninstall(data, reason) {}
