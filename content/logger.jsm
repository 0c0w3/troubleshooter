/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EXPORTED_SYMBOLS = [
  "logger",
];

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

const logger = {
  Logger: Logger,
};

function Logger(name, writer, logLineFormatter, objectFormatter) {
  this.name = name;
  this.level = Logger.level.ERROR;
  if (writer)
    this._write = writer;
  if (logLineFormatter)
    this._formatLogLine = logLineFormatter;
  if (objectFormatter)
    this._formatObject = objectFormatter;
}

let levels = "DEBUG INFO WARN ERROR";
Logger.level = levels.split(/\s+/).reduce(function (memo, levelName, idx) {
  memo[levelName] = idx;
  return memo;
}, {});

Logger.prototype = {

  log: function log(level, obj /* , obj2, obj3, ... */) {
    if (level < this.level)
      return;
    let levelName = "UNKNOWN";
    for (let name in Logger.level)
      if (Logger.level[name] === level) {
        levelName = name;
        break;
      }
    let msg = Array.slice(arguments, 1).
              map(function (obj) this._formatObject(obj), this).
              join(" ");
    this._write(this._formatLogLine(new Date(), levelName, msg), level);
  },

  _write: function _write(str, level) {
    dump(str);
    if (level === Logger.level.ERROR)
      Cu.reportError(str);
    else
      Cc["@mozilla.org/consoleservice;1"].
        getService(Ci.nsIConsoleService).
        logStringMessage(str);
  },

  _formatLogLine: function _formatLogLine(date, levelName, msg) {
    let name = this.name ? this.name + " " : "";
    return date.toLocaleFormat("%Y-%m-%d %T") + " " + name + "-- " +
           levelName + ": " + msg + "\n";
  },

  _formatObject: function _formatObject(obj) {
    if (typeof(obj) == "object") {
      let global = Components.utils.getGlobalForObject(obj);
      if (global.Error &&
          obj instanceof global.Error &&
          typeof(obj.stack) == "string")
        return String(obj) + " -- stack: [\n" +
               obj.stack.trim().split("\n").
                 map(function (frame) "  " + frame).join("\n") +
               "\n]";
    }
    return String(obj);
  },
};

for (let levelName in Logger.level) {
  let name = levelName;
  Logger.prototype[name.toLowerCase()] = function logWithLevel() {
    this.log.apply(this, [Logger.level[name]].concat(Array.slice(arguments)));
  };
}
