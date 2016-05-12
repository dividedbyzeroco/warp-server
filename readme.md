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

// Prepare config; You can also use process.env or store the config in a json file
var config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    default: 'default_table',
    apiKey: '12345678abcdefg'
};

// Create a WarpServer router for the API
var api = WarpServer.initialize(config);

// Apply the WarpServer router to your preferred base URL, using express' app.use() method
app.use('/api/1', api);
```

### Warp Model

Warp Models make it easy to define the tables found in the database. They contain special parameters which allow you to control the data that comes in and out of the server.

To define a Warp Model, simply create a `Warp.Model` class with the following parameters:

```javascript
Warp.Model.create({
    // Unique name assigned to the endpoint; table name
    className: '{CLASS_NAME}',
    
    // If the assigned className is not the same as the actual table name, specify the real table name here, OPTIONAL
    source: '{SOURCE}',
    
    // Define keys/columns available in the table
    keys: {
        viewable: ['{KEY1}', '{KEY2}'], // REQUIRED: Fields viewable in queries
        actionable: ['{KEY1}'] // REQUIRED: Fields editable in queries
    },
    
    // Validates values that are sent to the server
    validate: {
        // User-defined validation
        '{KEY1}': function(value, key) {
            // Some validations placed here
            // If the validations fail, return a string message
            return 'Validation failed for ' + key;
            // If the validations succeed, return nothing
            return;
        },
        // Pre-defined Validation; See section on Pre-defined Validations for more info
        '{KEY2}': WarpServer.Model.Validation.FixedString(8)
    },
    
    // Parses the values received, and pushes them to the backend for saving
    parse: {
        // User-defined parser
        '{KEY1}': function(value) {
            // Conduct some changes to the value, as needed;
            // Return the parsed value
            return value;
        },
        // Pre-defined Parser; See section on Pre-defined Parsers for more info
        '{KEY2}': WarpServer.Model.Parser.Integer
    },
    
    // Function that maniplates the keys' values before the values are saved
    beforeSave: function(keys) {
        // this.validate doesn't apply here
        // this.parse doesn't apply here
        // 'keys' is an object that contains the name of the keys and the assigned values
        // Return the keys after manipulating
        return keys;
    },
    
    // Function that executes after the values are saved
    afterSave: function(keys) {
        // this.validate doesn't apply here
        // this.parse doesn't apply here
        
        // 'keys' is an object that contains the name of the keys and the assigned values
        // Use the keys as needed
    }
});
```
For example, if we want to make a model for an `alien` table, we can write it as:

```javascript
var Alien = Warp.Model.create({
    className: 'alien',
    keys: {
        viewable: ['name', 'age', 'type'],
        actionable: ['name', 'age', 'type']
    },
    validate: {
        'name': function(value) {
            if(value.length < 8) return 'name must be 8 or more characters';
            return;
        },
        'age': WarpServer.Model.Validation.PositiveInteger
    },
    parse: {
        'age': WarpServer.Model.Parser.Integer,
        'type': function(value) {
            switch(value)
            {
                case 0: return 'dalek';
                case 1: return 'cyberman';
                case 2: return 'zygon';
                case 3: return 'slitheen';
            }
        }
    },
    beforeSave: function(keys) {
        if(keys['type'] == 'dalek' && keys['age'] > 200)
            keys['type'] = 'supreme_dalek';
            
        return keys;
    },
    afterSave: function(keys) {
        addToPapalMainframe(keys.id);
    }
});
```
In order to tell WarpServer to use the model we just created, we must register it before we initialize WarpServer:

```javascript
// ... some config code here
WarpServer.Model.register(Alien);
var api = WarpServer.initialize(config);
// ... additional code to initialize here
```

### Warp Object

The Warp Object represents a single item in...

### REST API

The REST API makes it easy to handle operations being made to Warp Objects. After initializing the server by following the instructions above, the following endpoints are readily made available for use by client-side applications.

#### Creating Objects

To create objects, 