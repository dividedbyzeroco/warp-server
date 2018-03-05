Warp Server
===========

__Warp Server__ is an `express` middleware that implements an easy-to-use API for managing and querying data from your backend.

Currently, `Warp Server` uses `mysql`/`mariadb` as its database of choice, but can be extended to use other data storage providers.

> NOTE: This readme is being updated for version 5.0.0. For the legacy version (i.e. versions < 5.0.0), see [readme-legacy.md](#readme-legacy.md)

## Table of Contents
- **[Installation](#installation)**  
- **[Configuration](#configuration)**

## Installation

To install Warp Server, simply run the following command:

```javascript
npm install --save warp-server
```

## Configuration

Warp Server is built on top of `express` and can be initialized in any `express` project. To do so, simply add the following configruation to the main file of your project:

```javascript
// References
import express from 'express';
import WarpServer from 'warp-server';

// Create a new Warp Server API
var api = new WarpServer({
    apiKey: 'someLongAPIKey123',
    masterKey: 'someLongMasterKey456',
    databaseURI: 'mysql://youruser:password@yourdbserver.com:3306/yourdatabase'
});

// Apply the Warp Server router to your preferred base URL, using express' app.use() method
var app = express();
app.use('/api/1', api.router);
```
