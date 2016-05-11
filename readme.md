WarpServer
==========

__WarpServer__ is a library for implementing the Warp Framework on Node.js. It consists of several classes similar to the ParsePlatform [https://github.com/ParsePlatform] which aim to produce endpoints easily accessible via a standard REST API. Currently, WarpServer uses `mysql` as its backend of choice and implements validators, parsers and formatters that can control the data coming in and out of the server.

### Installation

To install WarpServer via npm, simply use the install command to save it in your package.json:

```javascript
npm install --save warp-server
```

### Configuration

WarpServer is built on top of `express` and can be initialized in any `express` project. To do so, simply add the following configruation to the main file of your project:

```javascript
// Require WarpServer
var WarpServer = require('warp-server');

// Create a WarpServer router for the API
var api = WarpServer.initialize({ apiKey: '{YOUR_PREFERRED_API_KEY}' });

// Apply the WarpServer router to your preferred base URL, using express' app.use() method
app.use('api/1', api);
```