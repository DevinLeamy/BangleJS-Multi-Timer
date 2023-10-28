# _BangleJS 2 Multi-Timer_

> ### To time _multiple_ things.

### Install

1. Connect to your BangleJS 2 over Bluetooth LE, on a supported browser (e.g. Chrome or Edge).
2. Copy `app.js` into the web IDE and download in onto your BangleJS 2. Give the file a unique name, say `mytimer.app.js`.
3. Provide your App Loader with the metadata required the run the app by entering the code below into the web IDE console.

```js
require("Storage").write("mytimer.info", {
    id: "multi-timer",
    name: "Multi Timer",
    src: "mytimer.app.js",
})
```

### Build

Install the dependencies and then compile the TypeScript, `./src/app.ts`, into `./src/app.js`. 

```bash
npm install
npm build
```

### Rad Usage Shots

<p align="center">
  <img src="https://github.com/DevinLeamy/BangleJS-Multi-Timer/assets/45083086/774f5e0a-7f8c-4b61-a1c4-56d080e83f55" width="300" alt="one" />
  <img src="https://github.com/DevinLeamy/BangleJS-Multi-Timer/assets/45083086/b39c9c86-f2e6-4b7a-8dc7-93567ad0d4eb" width="300" alt="two" />
</p>
