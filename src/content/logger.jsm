/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EXPORTED_SYMBOLS = [
  "logger",
];

const logger = {
  Logger: Logger,
};

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

/**
 * Makes a new logger.
 *
 * Each call to log() takes a log level, and the logger itself also has a log
 * level.  If the level passed to log() is less than the logger's current level,
 * then that call to log() is ignored.  Set the logger's level using its level
 * property and the Logger.level values below.
 *
 * By default, the log outputs using dump and nsIConsoleService.
 *
 * writer, logLineFormatter, and objectFormatter are optional functions that
 * control the output of the logger.  They're used like this.  Each object
 * passed to log() is converted to a string using objectFormatter.  The
 * resulting strings are concatenated and the concatenation is passed to
 * logLineFormatter, which produces a new log line.  Finally, writer writes the
 * line to the log.  Each function is called bound to the logger.
 *
 * @param name              A string that will be printed in each log line.
 * @param writer            A function that writes lines to the log.  Called as:
 *                            writer(line, level)
 *                          line: The line, a string, to write.
 *                          level: The line's numeric log level.
 * @param logLineFormatter  A function that formats each log line.  Called as:
 *                            logLineFormatter(date, levelName, msg)
 *                          date: The date the line was logged.  A Date object.
 *                          levelName: The name of the line's log level.
 *                          msg: The content of the line.
 *                          This function should return a string.
 * @param objectFormatter   A function that formats each object that's logged.
 *                          Called as:
 *                            objectFormatter(obj)
 *                          obj: The object that's logged.  Often a string.
 *                          This function should return a string.
 */
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

Logger.level = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

Logger.prototype = {

  /**
   * Adds a new line to the log, unless the given level is less than the
   * logger's current level, in which case nothing happens.
   *
   * See also the level-named logging methods below.
   *
   * @param level  The numeric log level, one of the Logger.level values.
   * @param obj    The object(s) to log.  Often this is just a string, but it
   *               doesn't have to be.
   */
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

/**
 * Level-Named Logging Methods
 *
 * For each log level value in Logger.level, there's a corresponding Logger
 * method whose name is the lower-cased name of the level.  Since the level is
 * named by the method, you don't have to pass it a numeric log level.
 *
 * e.g., these calls are equivalent:
 *
 *   let logger = new Logger();
 *   logger.log(Logger.level.DEBUG, "hey");
 *   logger.debug("hey");
 */
for (let levelName in Logger.level) {
  let name = levelName;
  Logger.prototype[name.toLowerCase()] = function logWithLevel() {
    this.log.apply(this, [Logger.level[name]].concat(Array.slice(arguments)));
  };
}
