# _BangleJS 2 Multi-Timer_

> ### To time _multiple_ things.

### Install

1. Connect to your BangleJS 2 over bluetooth LE, on a supported browser (e.g. Chrome or Edge).
2. Copy `app.js` into the web IDE and download in onto your BangleJS 2. Give the file a unique name, say `mytimer.app.js`.
3. Provide your App Loader with the metadata required the run the app by entering the code below into the web IDE console.

```js
require("Storage").write("mytimer.info", {
    id: "multi-timer",
    name: "Multi Timer",
    src: "mytimer.app.js",
})
```
