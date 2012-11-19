Troubleshooter
==============

Troubleshooter is a restartless Firefox add-on that provides a simple Firefox
troubleshooting API to Mozilla web sites.  Here's the entire API:

    window.mozTroubleshoot.snapshotJSON(function (json) {
      console.log(json);
    });

`json` contains various data describing the user's Firefox including its
version, modified preferences, installed add-ons, and more.  Its schema is
defined by the `SNAPSHOT_SCHEMA` object [here][snapshot-schema].

[snapshot-schema]: http://mxr.mozilla.org/mozilla-central/source/toolkit/content/tests/browser/browser_Troubleshoot.js#73

All pages on the following domains are blessed with `mozTroubleshoot`:

  * www.mozilla.org
  * support.mozilla.org
  * input.mozilla.org

You can bless other domains with the environment variable
`TROUBLESHOOTER_ORIGIN`.  Set it to an origin, which is just a scheme + domain +
optional port string, like "http://www.mozilla.org" and
"http://www.mozilla.org:99".  Use "*" to bless all domains.  To bless multiple
domains, put them in a space-delimited string.

Firefox 10 is the oldest supported Firefox.  Some troubleshooting data is
unavailable on versions older than 18.  When particular data is unavailable, the
value of the relevant property in the JSON-encoded object will likely be an
error message.


Technical Notes
---------------

The `mozTroubleshoot` API is backed by the [Troubleshoot.jsm][troubleshoot-jsm]
API introduced in Firefox 18.  The add-on includes a copy of that module so that
users running older versions can use it, too, although some data will be
unavailable.  The copy was pulled from [mozilla-central revision
f3f379beb585][troubleshoot-jsm-rev] and was modified to remove its preprocessing
directives.

[troubleshoot-jsm]: http://mxr.mozilla.org/mozilla-central/source/toolkit/content/Troubleshoot.jsm
[troubleshoot-jsm-rev]: http://hg.mozilla.org/mozilla-central/file/f3f379beb585/toolkit/content/Troubleshoot.jsm

The add-on logs to the terminal (via `dump`) and Firefox's error console (via
`nsIConsoleService`).  By default only errors are logged, but you can make the
log more verbose by setting the environment variable `TROUBLESHOOTER_LOG_LEVEL`
to an integer indicating the desired log level.  0 is the debug log level and
logs everything.  See src/content/logger.jsm for details.
