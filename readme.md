WarpServer
==========

__WarpServer__ is a library for implementing the Warp Framework on Node.js. It consists of several classes which aim to produce endpoints easily accessible via a standard REST API. Currently, WarpServer uses `mysql` as its backend of choice and implements validators, parsers and formatters that can control the data coming in and out of the server.

### Installation

To install WarpServer via npm, simply use the install command to save it in your package.json:

```javascript
npm install --save warp-server
```

### Configuration

WarpServer is built on top of `express` and can be initialized in any `express` project. To do so, simply add the following configruation to the main file of your project:

```javascript
// References
var express = require('express');
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
var app = express();
app.use('/api/1', api);
```

### Models

Models make it easy to define the tables found in the database. They contain special parameters which allow you to control the data that comes in and out of the server.

To define a Model, simply create a `WarpServer.Model` class with the following parameters:

```javascript
WarpServer.Model.create({
    // Unique name assigned to the endpoint; is usally the same as the table name
    className: '{CLASS_NAME}',
    
    // If the assigned className is not the same as the table name, specify the real table name here, OPTIONAL
    source: '{SOURCE}',
    
    // Define keys/fields available in the table
    keys: {
        viewable: ['{KEY1}', '{KEY2}'], // REQUIRED: Fields viewable in queries
        actionable: ['{KEY1}', '{KEY2}'] // REQUIRED: Fields editable in queries
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
var Alien = WarpServer.Model.create({
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

We can now use the REST API to operate on `alien` objects. See the section regarding the REST API for more info.

### Pointers

Relations are a vital aspect of Relational Databases. With regards to the WarpServer, these are represented by `pointers`. Pointers are specific keys (fields) that point to a specific object from another table. This can be thought of as the `belongs_to` relationship or the `foreign_key` relationship in SQL databases. 

To specify a `pointer` in your Model, you may do so using the following syntax:

```javascript
{ '{KEY_NAME}': '{FOREIGN_KEY}' }
```

So if, for example, inside our `Alien` model, we would like to add pointers to a `Planet` model. We can do so by adding the following code to our `Model.create()` method:

```javascript
// Some code defining our model
keys: {
    viewable: ['name', 'age', 'type', { 'planet': 'planet_id' }],
    actionable: ['name', 'age', 'type', { 'planet': 'planet_id' }]
},
// Additional code defining our model
```

### User and Session Models

In order to handle user authentication and management, a special type of model called the User model can be added. It is similar to the `WarpServer.Model` except it requires a few additional fields.

Fields required by the User Model:
- username
- password
- email

For example, to create a User model using the `user` table:

```javascript
var User = WarpServer.Model.create({
    className: 'user',
    keys: {
        viewable: ['username', 'email'], // Note that password should not be viewable by the REST API
        actionable: ['username', 'password', 'email']
    },
    validate: {
        // Pre-defined validators are available for the fields required by the User Model
        // See the section on Pre-defined Validators for more info.
        'username': WarpServer.Model.Validation.FixedString(8, 16),
        'password': WarpServer.Model.Validation.Password(8),
        'email': WarpServer.Model.Validation.Email
    },
    parse: {
        // Pre-defined Parsers
        // See the section on Pre-defined Parsers for more info.
        'username': WarpServer.Model.Parser.NoSpaces,
        'password': WarpServer.Model.Parser.Password
    }
});
```

In order for us to use the defined model as a User model, we should use `.registerUser()` instead of the regular `.register()` method:

```javascript
// ... some config code here
WarpServer.Model.registerUser(User);
WarpServer.Model.register(Alien);
var api = WarpServer.initialize(config);
// ... additional code to initialize here
```

Aside from the User Model, we should also define a Session Model that, like the User Model, has special required fields:

- user (pointer)
- origin
- session_token

An example of a Session Model would be as follows:

```javascript
var Session = WarpServer.Model.create({
    className: 'session',
    keys: {
        viewable: [{ 'user': 'user_id' }, 'origin', 'session_token'], // Note that the user field is a pointer to the 'user' table
        actionable: [{ 'user': 'user_id'}, 'origin']
    },
    validate: {
        'user': WarpServer.Model.Validation.Pointer
    },
    
    // In order for us to generate special session tokens, we must use the Pre-defined PreSave function.
    // For more info on these pre-defined functions, please see the secion on PreSave functions.
    beforeSave: WarpServer.Model.PreSave.Session
});
```

Then, we register the created model by using the `.registerSession()` method:

```javascript
// ... some config code here
WarpServer.Model.registerUser(User);
WarpServer.Model.registerSession(Session);
WarpServer.Model.register(Alien);
var api = WarpServer.initialize(config);
// ... additional code to initialize here
```

We can now use the special user authentication and management operations made available by the REST API.

### Objects

The Warp Object represents a single item in...

### REST API

The REST API makes it easy to handle operations being made to Warp Objects. After initializing the server by following the instructions above, the following endpoints are readily made available for use by client-side applications.

#### Creating Objects

To create objects, 