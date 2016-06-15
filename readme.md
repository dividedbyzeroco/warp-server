Warp Server
===========

__Warp Server__ is a platform for implementing scalable backend services. It enables you to manage objects, webhooks and background jobs using a standard REST API, and comes equipped with various authentication features.

Currently, `Warp Server` uses `mysql` as its database of choice, but can be extended to use other data storage services.

## Table of Contents
- **[Installation](#installation)**  
- **[Configuration](#configuration)**
- **Features**
    - **[Models](#models)**
        - **[Pointers](#pointers)**
        - **[Files](#files)**    
        - **[User Authentication](#user-authentication)**
        - **[Using Model Directories](#using-model-directories)**
    - **[Migrations](#migrations)**
    - **[Functions](#functions)**
    - **[Queues](#queues)**
- **REST API**
    - **[Object API](#object-api)**
        - **[Objects](#objects)**
            - **[Headers](#headers)**
            - **[Creating Objects](#creating-objects)**
            - **[Updating Objects](#updating-objects)**
            - **[Deleting Objects](#deleting-objects)**
            - **[Fetching Objects](#fetching-objects)**
            - **[Pointers as Keys](#pointers-as-keys)**
            - **[Uploading Files](#uploading-files)**
            - **[Deleting Files](#deleting-files)**
        - **[Queries](#queries)**
            - **[Constraints](#constraints)**
            - **[Limit](#limit)**
            - **[Sorting](#sorting)**
    - **[User API](#user-api)**
        - **[Logging In](#logging-in)**
        - **[Validating Users/Fetching Current User](#validating-usersfetching-current-user)**
        - **[Signing Up](#signing-up)**
        - **[Logging Out](#logging-out)**
    - **[Migration API](#migration-api)**
        - **[Migration](#migration)**
        - **[Creating Migrations](#creating-migrations)**
        - **[Updating Migrations](#updating-migrations)**
        - **[Deleting Migrations](#deleting-migrations)**
        - **[Fetch Migrations](#fetch-migrations)**
        - **[Committing Migrations](#committing-migrations)**
        - **[Fetch Latest Migration Committed](#fetch-latest-migration-committed)**
        - **[Reverting Migrations](#reverting-migrations)**
        - **[Resetting Migrations](#resetting-migrations)**
    - **[Function API](#function-api)**
        - **[Running Functions](#running-functions)**    
    - **[Queue API](#queue-api)**
        - **[Starting Queues](#starting-queues)**
        - **[Stopping Queues](#stopping-queues)**
        - **[Viewing Queue Status](#viewing-queue-status)**
- **[References](#references)**

## Installation

To install Warp Server via npm, simply use the install command to save it in your package.json:

```javascript
npm install --save warp-server
```

## Configuration

Warp Server is built on top of `express` and can be initialized in any `express` project. To do so, simply add the following configruation to the main file of your project:

```javascript
// References
var express = require('express');
var WarpServer = require('warp-server');

// Prepare config; You can also use process.env or store the config in a json file
var config = {
    security: {
        apiKey: '12345678abcdefg',
        masterKey: 'abcdefg12345678'
    },
    database: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        default: 'default_database',    
    }
};

// Create a new Warp Server API
var api = new WarpServer(config);

// Apply the Warp Server router to your preferred base URL, using express' app.use() method
var app = express();
app.use('/api/1', api.router());
```

## Models

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
        viewable: ['{KEY1}', '{KEY2}', '{KEY3}'], // REQUIRED: Fields viewable in queries
        actionable: ['{KEY1}', '{KEY2}', '{KEY3}'], // REQUIRED: Fields editable in queries
        
        // To define pointers (i.e. foreign key relations), declare them via the `pointers` option, OPTIONAL
        // For more info, please see section on Pointers
        pointers: {
            '{KEY2}': {
                className: '{CLASS_NAME_OF_POINTER}',
                via: '{FOREIGN_KEY}' // OPTIONAL, if `via` is not set, it is assumed to be `className`_id
            }
        },
        
        // To define file keys (i.e. fields for storing file URL's), declare them via the `files` option, OPTIONAL
        // For more info, please see section on Files
        files: ['{KEY3']
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
    
    // Formats the values requested, and pushes them to the response
    format: {
        // User-defined formatter
        '{KEY1}': function(value) {
            // Conduct some changes to the value, as needed;
            // Return the formatted value
            return value;
        },
        // Pre-defined Formatter; See section on Pre-defined Formatters for more info
        '{KEY2}': WarpServer.Model.Parser.Date
    },
    
    // Function that manipulates the keys' values before the values are saved
    beforeSave: function(request, response) {
        // this.validate doesn't apply here
        // this.parse doesn't apply here
        
        // Check if Object has just been newly created
        if(request.isNew)
            return; // Apply some logic here
            
        // Check if Object has just been recently destroyed
        if(request.isDestroyed)
            return; // Apply some logic here
        
        // request.keys is a map that contains the modified keys of the object
        request.keys.set('{KEY1}', '{VALUE1}');
        var key2 = request.keys.get('{KEY2}');
        
        // Call the success response after the keys have been manipulated
        if(success)
            response.success();
        else
            // Or call the error response if an error has been encountered
            response.error(error);
    },
    
    // Function that executes after the values are saved
    afterSave: function(request) {
        // this.validate doesn't apply here
        // this.parse doesn't apply here
        
        // Check if Object has just been newly created
        if(request.isNew)
            return; // Apply some logic here
            
        // Check if Object has just been recently destroyed
        if(request.isDestroyed)
            return; // Apply some logic here
        
        // request.keys is a map that contains the modified keys of the object
        request.keys.set('{KEY1}', '{VALUE1}');
        var key2 = request.keys.get('{KEY2}');
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
                case 4: return 'gallifreyan';
                default: return 'extraterrestrial';
            }
        }
    },
    beforeSave: function(req, res) {
        if(req.keys.get('type') == 'dalek' && req.keys.get('age') > 200)
            req.keys.set('type', 'supreme_dalek');
            
        res.success();
    },
    afterSave: function(req) {        
        addToPapalMainframe(req.keys.get('id'));
    }
});
```

In order to tell Warp Server to use the model we just created, we need to register it after we initialize Warp Server:

```javascript
// ... some code here
var api = new WarpServer(config);
api.registerModel(Alien);
// ... additional code to initialize here
```

NOTE: This approach is only advisable for development environments. For production environments, it is best to use the [Model Directory Approach](#using-model-directories).

Once completed, we can now use the Object API to operate on `alien` objects. See the section regarding the [Object API](#object-api) for more info.

## Pointers

Relations are a vital aspect of Relational Databases. With regards to the Warp Server, these are represented by `pointers`. Pointers are keys (fields) which point to specific objects from another table. This can be thought of as the `belongs_to` relationship or the `foreign_key` relationship in SQL databases. 

To specify a `pointer` in your Model, you may do so by adding a `pointers` option in your `keys` config:

```javascript
{
    keys: {
        // Other key configurations...        
        // Pointers configuration:
        pointers: {
            '{KEY_NAME}': {
                className: '{CLASS_NAME_OF_POINTER}',
                via: '{FOREIGN_KEY}' // OPTIONAL, if not set, the foreign key is assumed to be `className`_id
            }
        } 
    }
}
```

So if, for example, inside our `Alien` model, we would like to add pointers to a `Planet` model. We can do so by adding the following code to our `Model.create()` method:

```javascript
// Some code defining our model
keys: {
    viewable: ['name', 'age', 'type', 'planet'],
    actionable: ['name', 'age', 'type', 'planet'],
    pointers: {
        'planet': {
            className: 'planet',
            via: 'planet_id'
        }
    }
},
// Additional code defining our model
```

## Files

Sometimes, you may need to upload files to your server and store them persistently. In this particular case, Warp Server helps simplify this process with the help of `Warp Files`. Warp Files allow you to define keys where you would want to store file-related content. 

On the database side, it stores a `key` string which represents the file inside your desired file storage system. By default, Warp Server uses local storage, but you can define other forms of storage providers such as Amazon S3 or Azure Storage.

To specify a `file` in your Model, you may do so by adding a `files` option in your `keys` config:

```javascript
{
    keys: {
        // Other key configurations...        
        // Files configuration:
        files: ['{KEY_NAME}']
    }
}
```

So if, for example, inside our `Alien` model, we would like to add a file named `profile_pic`. We can do so by adding the following code to our `Model.create()` method:

```javascript
// Some code defining our model
keys: {
    viewable: ['name', 'age', 'type', 'planet', 'profile_pic'],
    actionable: ['name', 'age', 'type', 'planet', 'profile_pic'],
    pointers: {
        'planet': {
            className: 'planet',
            via: 'planet_id'
        }
    },
    files: ['profile_pic']
},
// Additional code defining our model
```

## User Authentication

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
        // NOTE: The password should not be viewable by the Object API
        viewable: ['username', 'email'],
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

Aside from the User Model, we should also define a Session Model that, like the User Model, has special required fields:

- user (pointer)
- origin
- session_token

An example of a Session Model would be as follows:

```javascript
var Session = WarpServer.Model.create({
    className: 'session',
    keys: {
        // NOTE: The user field is a pointer to the 'user' table
        viewable: ['user', 'origin', 'session_token'],
        actionable: ['user', 'origin'],
        pointers: {
            'user': {
                className: 'user',
                via: 'user_id'
            }
        }
    },
    
    // NOTE: In order for us to generate special session tokens, we must use the Pre-defined PreSave function.
    // For more info on these pre-defined functions, please see the secion on PreSave functions.
    beforeSave: WarpServer.Model.PreSave.Session
});
```

Then, we register the created authentication models by adding it to our api:

```javascript
// ... some code here
var api = new WarpServer(config);
api.registerAuthModels(User, Session);
// ... additional code to initialize here
```

NOTE: To enable authentication, you must create both models.
We can now use the special user authentication and management operations made available by the [User API](#user-api).

### Using Model Directories

**NOTE: This is the recommended approach for production environments**

If you want to modularize your code into different files inside a folder, you can opt to place the folder name as a `source` option, instead of manually registering them to the api.
Additionally, you can also declare the `user` and `session` options using this approach. You just need to specify the filenames of the respective authentication models.

For example, if you have a directory structure such as the following:

```
|-- app
|---- server
|------ models
|-------- alien.js
|-------- planet.js
|-------- user.js
|-------- session.js
|------ api.js
|-- app.js
```

You can declare your `api` inside `api.js`, and add a `models` option inside your configuration. For example:

```javascript
// References
var path = require('path');
var WarpServer = require('warp-server');

// Export the api
module.exports = new WarpServer({
    security: {
        apiKey: '12345678abcdefg',
        masterKey: 'abcdefg12345678'
    },
    database: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        default: 'default_database',    
    }
    models: {
        source: path.join(__dirname, 'models'),
        user: 'user',
        session: 'session'
    }
});
```

Then, reference the api inside `app.js`:

```javascript
var express = require('express');
var api = require('./app/server/api');
var app = express();

app.use('/api/1', api.router());
```


## Migrations

Managing database schemas are usually handled by administrators using SQL clients. For Warp Server, we simplify this process by using `migrations`. Migrations make it easy to create, alter and drop database `schemas`. Additionally, they also allow versioning of these modifications, so you can easily `commit` or `revert` changes programmatically.

To activate the `migrations` feature, simply add a migrations option in your Warp Server config:

```javascript
// ... some config code here
module.exports = new WarpServer({
    // ... previous configs here
    migrations: {
        activated: true
    }
});
```

Once applied and the server initiates, the migrations table is automatically created in the default database. By default, the name of the table is `migration`. If you need to change this, simply add a `className` option:

```javascript
// ... some config code here
var config = {
    // ... previous configs here
    migrations: {
        activated: true,
        className: 'migration_audit'
    }
};
var api = new WarpServer(config);
// ... additional code to initialize here
```

You can now access the `migrations` API to start creating `schemas`. Please see section on the [Migration API](#migration-api) for more info.


## Functions

Oftentimes, there might be cases when the Object API may not be enough for your app requirements. In these cases, you may opt to use `Functions`.

`Functions` allow you to set up custom API's to suit your app's growing needs.

To define a Function, simply create a `WarpServer.Function` class with the following parameters:

```javascript
WarpServer.Function.create({
    // Unique name assigned to the endpoint, you can use Alphanumeric characters, underscores and/or dashes
    name: '{FUNCTION_NAME}',
    
    // The action to run once the endpoint is called
    action: function(request, response) {
        // request.keys is a map that contains the modified keys of the object
        // NOTE: Unlike the `.beforeSave()` function in Models, you can only use `.get()` for Functions
        var key2 = request.keys.get('{KEY2}');
                
        // Call the success response after the keys have been manipulated
        if(success)
            response.success(/* The value you want to return to the user */);
        else
            // Or call the error response if an error has been encountered
            response.error(error);
    }
});
```

For example, if we want to make a function for destroying all aliens of a specific `type`, we can write it as:

```javascript
// Get a modified version of the Warp JS SDK from the API
// For more info on the Warp JS SDK, please see http://github.com/jakejosol/warp-sdk-js
var api = new WarpServer(config);
var Warp = api.Warp;

// Create the function
var destroyDaleks = WarpServer.Function.create({
    name: 'destroy-aliens',
    action: function(req, res) {
        var type = req.keys.get('type');
        var query = new Warp.Query('alien');
        
        query.equalTo('type', type)
        .find(function(aliens) {
            // Destroy aliens asynchronously
            aliens.each(function(alien) {
                return alien.destroy();
            });
            
            // Return a response
            res.success('Deleted all `' + type + '` aliens');
        })
        .catch(function(error) {
            res.error(error);
        });
    }
});
```

In order to use the function we just created, we should register it after we initialize Warp Server:

```javascript
// ... some code here
api.registerFunction(destroyDaleks);
// ... additional code to initialize here
```

You can also opt to specify a folder where all your functions are stored. Just like in the section regarding the [Model Directory Approach](#using-model-directories).

For example, if we have a directory such as this:

```
|-- app
|---- server
|------ models
|------ functions
|-------- destroy-daleks.js
|------ api.js
|-- app.js
```

You can add the functions inside `api.js`:

```javascript
// ... some code here
module.exports = new WarpServer({
    // .. previous configs here
    functions: {
        source: path.join(__dirname, 'functions')
    }
});
```

The Functions are now ready to be called. For more info, see the section regarding the [Function API](#function-api).


## Queues

Functions are useful for running adhoc tasks; however, if you want to run frequent background jobs, you can use `Queues`. `Queues` are specific tasks which are executed periodically based on a given interval. The Warp Server allows you to easily start, stop and get statuses for these different background jobs.

To define a Queue, simply create a `WarpServer.Queue` class with the following parameters:

```javascript
WarpServer.Queue.create({
    // Unique name assigned to the endpoint, you can use Alphanumeric characters, underscores and/or dashes
    name: '{FUNCTION_NAME}',
    
    // The action to run for every interval
    action: function() {
        // Perform any task here
    },
    
    // A pre-defined interval that determines the frequency of a given task
    // The interval follows the format of the Cron Job in Linux
    // For more information about interval formats, please see http://npmjs.com/package/cron
    interval: '{INTERVAL}',
    
    // An OPTIONAL parameter that determines the relative timezone that the interval would follow
    // The default value is UTC
    timezone: '{TIMEZONE}'
});
```

For example, if we want to make a queue for sending messages, we can write it as:

```javascript
// Get a modified version of the Warp JS SDK from the API
// For more info on the Warp JS SDK, please see http://github.com/jakejosol/warp-sdk-js
var api = new WarpServer(config);
var Warp = api.Warp;

// Create the queue
var sendMessages = WarpServer.Queue.create({
    name: 'send-messages',
    action: function() {
        var query = new Warp.Query('message');
        
        query.doesNotExist('sent_at')
        .find(function(messages) {
            // Sending messages asynchronously
            messages.each(function(message) {
                console.log(message.get('content'));
            });
        })
        .catch(function(error) {
            res.error(error);
        });
    },
    interval: '* * 10 * * *' // Run every 10 o'clock
});
```

In order to use the queue we just created, we should register it after we initialize Warp Server:

```javascript
// ... some code here
api.registerQueue(sendMessages);
// ... additional code to initialize here
```

You can also opt to specify a folder where all your queues are stored. Just like in the section regarding the [Model Directory Approach](#using-model-directories).

For example, if we have a directory such as this:

```
|-- app
|---- server
|------ models
|------ functions
|------ queues
|-------- send-messages.js
|------ api.js
|-- app.js
```

You can add the queues inside `api.js`:

```javascript
// ... some code here
module.exports = new WarpServer({
    // .. previous configs here
    queues: {
        source: path.join(__dirname, 'queues')
    }
});
```

The Queues are now ready to be used. For more info, see the section regarding the [Queue API](#queue-api).


## Object API

The Object API makes it easy to handle operations being made to Objects. After initializing the server by following the instructions above, the following endpoints are readily made available for use by client-side applications.

### Objects

Objects represent individual instances of models. In terms of the database, an Object can be thought of as being a `row` in a table. Throughout the Warp Framework, Objects are the basic vehicles for data to be transmitted to and fro the server.

Each Object contains different keys which can be set or retrieved as needed. Among these keys are three special ones:

- id: a unique identifier that distinguishes an object inside a table
- created_at: a timestamp that records the date and time when a particular object was created (UTC)
- uppdated_at: a timestamp that records the date and time when a particular object was last modified (UTC)

These keys are specifically set by the server and cannot be modified by the user.


### Headers

When making HTTP requests to the Object API, it is important that the API Key is set. To do so, remember to set the `X-Warp-API-Key` header for your request:

`X-Warp-API-Key: 12345678abcdefg`

Often times, once a user has logged in, it is also important to place the `X-Warp-Session-Token` header in order to use certain operations only accessible to authorized users:

`X-Warp-Session-Token: fhwcunf2uch20j631`


### Creating Objects

To create an Object for a specific model, execute a POST request to:

`/classes/{CLASS_NAME}`

with a JSON Object that contains the keys of your new Object:

`{"{KEY1}": "{VALUE1}", "{KEY2}": "{VALUE2}"}`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"name":"The Doctor", "age": 150000, "type": 4}' \
http://localhost:3000/api/1/classes/alien
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 21,
        "name": "The Doctor",
        "age": 150000,
        "type": "gallifreyan",
        "created_at": "2016-05-12T09:18:44Z",
        "updated_at": "2016-05-12T09:18:44Z"
    }
}
```


### Updating Objects

To update an Object for a specific model, execute a PUT request to:

`/classes/{CLASS_NAME}/{ID}`

with a JSON Object that contains the modified keys of your existing Object:

`{"{KEY1}": "{VALUE1}", "{KEY2}": "{VALUE2}"}`

For example:

```bash
curl -X PUT \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"age": 300}' \
http://localhost:3000/api/1/classes/alien/141
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 141,
        "age": 300,
        "created_at": "2016-05-12T09:18:44Z",
        "updated_at": "2016-05-12T14:03:21Z"
    }
}
```


### Deleting Objects

To delete an Object for a specific model, execute a DELETE request to:

`/classes/{CLASS_NAME}/{ID}`

For example:

```bash
curl -X DELETE \
-H 'X-Warp-API-Key: 12345678abcdefg' \
http://localhost:3000/api/1/classes/alien/29
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 29,
        "rows": 1,
        "updated_at": "2016-05-12T22:11:09Z",
        "deleted_at": "2016-05-12T22:11:09Z"
    }
}
```


### Fetching Objects

To fetch a single Object for a specific model, execute a GET request to:

`/classes/{CLASS_NAME}/{ID}`

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
http://localhost:3000/api/1/classes/alien/13
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 13,
        "name": "Wormwood",
        "age": 80,
        "type": "extraterrestrial",
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T23:21:18Z"
    }
}
```


### Pointers as Keys

In order to pass `pointers` as keys when creating or updating an object, the keys must have a value similar to the following:

`{ "type": "Pointer", "className": "{CLASS_NAME}", "id": "{ID}" }`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"name":"The Doctor", "planet": { "type": "Pointer", "className": "planet", "id": 8 }}' \
http://localhost:3000/api/1/classes/alien
```


### Uploading Files

In order to upload `files` to the server, execute a POST request to:

`/files`

With multipart form data that contains a `file` key pointing to the desired file and a `name` key to set the filename:

`file=@{FILE_PATH}&name={FILE_NAME}`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-F 'file=@image_alien_face.jpg' \
-F 'name=image_alien_face.jpg' \
http://localhost:3000/api/1/files
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "key": "20160523005923_1dUfhw81818dh1d_image_alien_face.jpg",
        "url": "http://localhost:3000/public/storage/20160523005923_1dUfhw81818dh1d_image_alien_face.jpg"
    }
}
```

After receiving the newly named `key`, you may associate this file when creating or updating an object by passing the following value:

`{ "type": "File", "key": "{FILE_KEY}" }`

For example:

```bash
curl -X PUT \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"name": "Straxx", "profile_pic": { "type": "File", "key": "20160523005923_1dUfhw81818dh1d_image_alien_face.jpg" }}' \
http://localhost:3000/api/1/classes/alien/28
```


### Deleting Files

In order to delete `files` from the server, execute a DELETE request to:

`/files`

with a JSON Object that contains the key of your existing file:

`key={FILE_KEY}`

For example:

```bash
curl -X DELETE \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"key": "20160523005923_1dUfhw81818dh1d_image_alien_face.jpg"}' \
http://localhost:3000/api/1/files
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "key": "20160523005923_1dUfhw81818dh1d_image_alien_face.jpg",
        "deleted_at": "2016-05-12T22:11:09Z"
    }
}
```

Note: Make sure that before a file is deleted, all objects associated with it are disassociated.


## Queries

There are certain scenarios when you may need to find more than one Object from a model. In these instances, it would be convenient to use Queries. Queries allow you to find specific Objects based on a set of criteria.

To query Objects from a specific model, execute a GET request to:

`/classes/{CLASS_NAME}`

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
http://localhost:3000/api/1/classes/alien
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": [{
        "id": 21,
        "name": "The Doctor",
        "age": 150000,
        "type": "gallifreyan",
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T23:21:18Z"
    },
    {
        "id": 13,
        "name": "Wormwood",
        "age": 80,
        "type": "extraterrestrial",
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T23:21:18Z"
    },
    {
        "id": 141,
        "name": "Straxx",
        "age": 300,
        "type": "extraterrestrial",
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T23:21:18Z"
    }]
}
```

### Constraints

Constraints help filter the results of a specific query. In order to pass constraints for a Query, set a `where` parameter with a JSON string containing all the constraints you wish to apply.

To specify constraints, you may do so using the following syntax:

```json
{
    "{NAME_OF_KEY}": {
        "{NAME_OF_CONSTRAINT}": "{VALUE}"
    }
}
```

Available constraints:

- eq: equal to
- neq: not equal to
- gt: greater than
- gte: greater than or equal to
- lt: less than
- lte: less than or equal to
- ex: is not null/is null (value is either true or false)
- in: contained in array
- nin: not contained in array

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'where={"age": {"gte": 20}, "type": {"in": ["dalek", "gallifreyan"]}}' \
http://localhost:3000/api/1/classes/alien
```

### Limit

By default, Warp Server limits results to the top 100 objects that satisfy the query criteria. In order to increase the limit, you can specify the desired value via the `limit` parameter. Also, in order to implement pagination for the results, you can combine the `limit` with the `skip` parameter. The `skip` parameter indicates how many items are to be skipped when executing the query. In terms of scalability, it is advisable to limit results to 1000 and use skip to determine pagination.

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'limit=1000&skip=1000' \
http://localhost:3000/api/1/classes/alien
```

### Sorting

Sorting determines the order by which the results are returned. They are also crucial when using the `limit` and `skip` parameters. In the `order` parameter of the basic query, a JSON string is expected to be placed with the following format:

```json
[
    { "{NAME_OF_KEY}": "{1 (Ascending) or -1 (Descending)}" }
]
```

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'sort=[{"type":1},{"age":-1}]' \
http://localhost:3000/api/1/classes/alien
```

## User API

User accounts are often an essential part of an application. In Warp, these are represented by User Objects. Unlike regular Objects, User Objects have a special endpoint to manage operations applied to them:

`/users`

Thus, all the endpoints for the User object are the same as the endpoints for regular Objects, except for a few minor adjustments:

- Create: POST `/users`
- Update: PUT `/users/{ID}`
- Delete: DELETE `/users/{ID}`
- Fetch: GET `/users/{ID}`
- Query: GET `/users`

Also, aside from these endpoints, the User Object has additional operations that can help in user management and authentication. These include logins, registration and session management endpoints.

### Logging In

To log in to an existing user account, execute a POST request to:

`/login`

with a JSON Object that contains the specified user's username and password:

`{ "username": "{USERNAME}", "password": "{PASSWORD}" }`

Also, if you would like to track where the user logged in from, you can use the following header:

`X-Warp-Origin: {ORIGIN}`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Origin: android' \
-H 'Content-Type: application/json' \
--data '{"username": "sarajanesmith", "password": "k9_and_luke"}' \
http://localhost:3000/api/1/login
```

You will receive a JSON response that contains the user and the session token for the successful login, similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "user": {
            "type": "Pointer",
            "id": 5
        },
        "origin": "android",
        "session_token": "981Tu3R831dHdh81s",
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T22:11:09Z"
    }
}
```

Once received, it is important to securely store the session token and use it in succeeding queries for as long as the user is logged in:

```bash
-H 'X-Warp-Session-Key: 981Tu3R831dHdh81s'
```

### Validating Users/Fetching Current User

To validate if a user session token is valid or to fetch the current user associated with a session token, execute a GET request to:

`/users/me`

with the session token included in the header:

`X-Warp-Session-Key: 981Tu3R831dHdh81s`

For example:

```bash
curl -X GET \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Session-Token: 981Tu3R831dHdh81s' \
http://localhost:3000/api/1/users/me
```

The expected response would be similar to the following, if the session token is valid:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 5,
        "username": "sarajanesmith",
        "email": "sarajanesmith@tardis.com",
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T22:11:09Z"
    }
}
```

Otherwise, it will return a Warp Error in the JSON response. For more info, please see the corresponding section regarding Warp Errors.

### Signing Up

To register a new user, execute a POST request to:

`/users`

with a JSON Object that contains the desired keys of your new Object, including `username`, `password` and `email`:

```json
{
    "username": "{USERNAME}",
    "password": "{PASSWORD}",
    "email": "{EMAIL}",
    "{KEY1}": "{VALUE1}", 
    "{KEY2}": "{VALUE2}"
}
```

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"username": "marthajones", "password": "doctorjones", "email": "martha@unit.co.uk"}' \
http://localhost:3000/api/1/users
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 9,
        "username": "marthajones",
        "email": "martha@unit.co.uk",
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T22:11:09Z"
    }
}
```

After creating the user, it is often good practice to chain another request to log in to the newly created user account automatically.

### Logging Out

To log out of an existing user session, execute a GET request to:

`/logout`

with the session token included in the header:

`X-Warp-Session-Token: 981Tu3R831dHdh81s`

For example:

```bash
curl -X GET \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Session-Token: 981Tu3R831dHdh81s` \
http://localhost:3000/api/1/logout
```

The expected response would be similar to the following, if the session token is valid:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 9,
        "updated_at": "2016-05-12T22:11:09Z",
        "deleted_at": "2016-05-12T22:11:09Z"
    }
}
```

## Migration API

Once the `migrations` feature has been activated, you may now access the operations provided by the Migration API. Note that the `X-Warp-Master-Key` must be set for every request done on the Migration API. It is advised to only keep the master key in secure environments. Never make this master key publicly accessible.

### Migration

A `migration` is a JSON object that defines the operations to be made by the `migrations` feature:

- id: a unique identifier for the migration (You can use A-z, 0-9 and '-', '_'); a common pattern would be to usually place a timestamp at the beginning of the ID;
- up: a JSON object that contains operations to be executed once a `commit` command is executed
- down: a JSON object that contains operations to be executed once a `revert` command is executed

For the `up` and `down` options, the JSON objects would be defined in the following format:

```javascript
{
    // Define schemas which are to be created
    "create": {
        "{SCHEMA1}": {
            // You can define a field via a JSON object of options
            "{FIELD1}": {
                "type": "{DATA_TYPE}", // Data type as defined in the Migration Data Types section
                "size": "{SIZE}", // Field length; See Migration Data Types section for more info
                "addons": ["{FIELD_DETAIL1}"] // A list of additional details; See Migration Details section for more info
            }
        },
        "{SCHEMA2}": {
            // You can also define a field via a string, with the desired data type, as a shorthand
            "{FIELD1}": "{DATA_TYPE}"
        }
    },
    // NOTE: By default, newly created schemas have the following fields included:
    // - id
    // - created_at
    // - updated_at
    // - deleted_at
    //
    // In order to avoid unexpected errors, it is advised to keep these fields untouched
    
    // Define schemas which are to be altered
    "alter": {
        "{SCHEMA3}": {
            "{FIELD1}": {
                "action": "{add|modify|rename|drop}", // Action to be made on the selected field; See Migration Actions section for more info
                "type": "{DATA_TYPE}", // New data type; only applicable to `add`, `modify`, and `rename` actions
                "size": "{SIZE}", // New field length; only applicable to `add`, `modify`, and `rename` actions
                "addons": ["{FIELD_DETAIL1}"], // A list of additional details; only applicable to `add` actions
                "to": "{NEW_FIELD_NAME}" // New field name; only applicable to `rename` actions 
            }
        }
    },
    
    // Define schemas which are to be dropped
    "drop": ["{SCHEMA4}", "{SCHEMA5}", "{SCHEMA6}"]
}
```

### Creating Migrations

To create a Migration, execute a POST request to:

`/migrations/{CLASS_NAME}`

with a JSON Object that contains the keys of your new Migration:

`{"id": "{VALUE1}", "up": "{VALUE2}", "down": "{VALUE3}"}`

or a reference to a `.json` file:

`@{FILE_NAME}.json`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
-H 'Content-Type: application/json' \
--data @201605251325-migration.json \
http://localhost:3000/api/1/migrations
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {        
        "id": "201605251325-migration",
        "updated_at": "2016-05-12T22:11:09Z",
        "created_at": "2016-05-12T22:11:09Z"
    }
}
```

### Updating Migrations

To update a Migration, execute a PUT request to:

`/migrations/{ID}`

with a JSON Object that contains the keys of your existing Migration:

`{"id": "{VALUE1}", "up": "{VALUE2}", "down": "{VALUE3}"}`

or a reference to a `.json` file:

`@{FILE_NAME}.json`

For example:

```bash
curl -X PUT \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
-H 'Content-Type: application/json' \
--data @201605251325-migration.json \
http://localhost:3000/api/1/migrations/201605251325-migration
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {        
        "id": "201605251325-migration",
        "updated_at": "2016-05-12T22:11:09Z"
    }
}
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": 141,
        "age": 300,
        "created_at": "2016-05-12T09:18:44Z",
        "updated_at": "2016-05-12T14:03:21Z"
    }
}
```

### Deleting Migrations

To delete a Migration, execute a DELETE request to:

`/migrations/{ID}`

For example:

```bash
curl -X DELETE \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/migrations/201605251325-migration
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": "201605251325-migration",
        "updated_at": "2016-05-12T22:11:09Z",
        "deleted_at": "2016-05-12T22:11:09Z"
    }
}
```

### Fetch Migrations

To fetch a Migration, execute a GET request to:

`/migrations/{ID}`

For example:

```bash
curl -X GET \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/migrations/201605251325-migration
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": "201605251325-migration",
        "up": {
            "create": {
                "companion": {
                    "name": {
                        "type": "string",
                        "size": 60,
                        "addons": ["unique"]
                    }
                }
            }
        },
        "down": {
            "drop": ["companion"]
        }
}
```

### Committing Migrations

To commit pending Migrations, execute a POST request to:

`/migrations/commit`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/migrations/commit
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": ["201605221332-first-migration", "201605251325-migration"]
}
```

### Fetch Latest Migration Committed

To fetch the latest Migration committed, execute a GET request to:

`/migrations/current`

For example:

```bash
curl -X GET \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/migrations/current
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "id": "201605251325-migration",
        "up": {
            "create": {
                "companion": {
                    "name": {
                        "type": "string",
                        "size": 60,
                        "addons": ["unique"]
                    }
                }
            }
        },
        "down": {
            "drop": ["companion"]
        }
}
```

### Reverting Migrations

To revert the latest Migration, execute a POST request to:

`/migrations/revert`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/migrations/revert
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": "201605251325-migration"
}
```

### Resetting Migrations

To revert all committed Migrations, execute a POST request to:

`/migrations/reset`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/migrations/reset
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": ["201605221332-first-migration", "201605251325-migration"]
}
```


## Function API

Once the `function` feature has been set up, you may now access the operations provided by the Function API.

### Running Functions

To run a Function, execute a POST request to:

`/functions/{FUNCTION_NAME}`

with a JSON Object that contains the keys for your request:

`{"{KEY1}": "{VALUE1}", "{KEY2}": "{VALUE2}"}`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"type": 0}' \
http://localhost:3000/api/1/functions/destroy-aliens
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": "Destroyed all `dalek` aliens" 
}
```


## Queue API

Once the `queue` feature has been set up, you may now access the operations provided by the Queue API. Note that the `X-Warp-Master-Key` must be set for every request done on the Queue API. It is advised to only keep the master key in secure environments. Never make this master key publicly accessible.

### Starting Queues

To start a Queue, execute a POST request to:

`/queues/{QUEUE_NAME}/start`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/queues/send-messages/start
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "name": "send-messages"
    }
}
```

### Stopping Queues

To stop a Queue, execute a POST request to:

`/queues/{QUEUE_NAME}/stop`

For example:

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/queues/send-messages/stop
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "name": "send-messages"
    }
}
```

### Viewing Queue Status

To view a Queue's status, execute a GET request to:

`/queues/{QUEUE_NAME}`

For example:

```bash
curl -X GET \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/queues/send-messages
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "name": "send-messages",
        "is_active": true,
        "latest_success": "2016-06-09 10:00:00",
        "latest_error": {
            "error": "Could not load data",
            "failed_at": "2016-06-10 10:00:00" 
        }
    }
}
```


## References

### WarpServer.Model.Validation

- FixedString(int: min, int: max) - checks whether a given string value has at least `min` characters and has, at most, `max` characters
- Password(int: min, int: max) - same as FixedString but automatically appends the Password parser to the model, if added
- Email - validates if a given string has the right email format
- Integer - validates if a given value is an integer
- PositiveInteger - validates if a given value is a counting number
- Float - validates if a given value is a float value
- Pointer - validates if a given value is a pointer; automatically appends the Pointer parser and Pointer formatter, if added

### WarpServer.Model.Parser

- NoSpaces - removes spaces from the entire string
- Password - hashes a given string using bcrypt
- Integer - parses a given value to an integer
- Float - parses a given value to a float value
- Date - parses a given string as a database-friendly datetime value
- Pointer - parses a given pointer as a database-friendly value

### WarpServer.Model.Formatter

- Date - formats a retrieved value as an ISO 8061 date string (UTC)
- Pointer - formats a retrieved value as a pointer

### WarpServer.Model.PreSave

- Session - automatically generates a random session_token for a session object and sets the deleted_at key relative to the set expiry date (default: 30 days)

### WarpServer.Error Codes

- Missing Configuration: 300 - a parameter is missing or a process has been omitted
- Internal Sever Error: 100 - an unexpected error occurred internally
- Query Error: 101 - an error occurred when querying the database
- Invalid Credentials: 102 - credentials for a user operation are missing or are invalid
- Invalid Session Token: 103 - session token is not set or is invalid
- Invalid Object Key: 104 - an object could not be saved because a key failed validations
- Invalid Pointer: 105 - a given pointer is invalid
- Forbidden Operation: 106 - a user is not authorized to perform a requested operation
- Username Taken: 107 - the provided username is already taken
- Email Taken: 108 - the provided email is already taken
- Invalid API Key: 109 - an API Key is not set or the given key is invalid
- Model Not Found: 110 - the requested model/class does not exist
- Function Not Found: 111 - the requested function does not exist

### WarpServer.Migration Data Types

- string: VARCHAR (default size: 30)
- email: VARCHAR (default size: 60)
- password: VARCHAR (default size: 250)
- text: TEXT (no size)
- acl: TEXT (no size)
- datetime: DATETIME (no size)
- float: FLOAT (default size: '14, 2')
- money: FLOAT (default size: '14, 2')
- geopoint: FLOAT (default size: '12, 8')
- integer: INT (default size: 11)
- pointer: INT (default size: 11)

### WarpServer.Migration Details

- primary: set the field as a PRIMARY KEY
- increment: set the field as AUTO_INCREMENT
- unique: set the field as UNIQUE
- required: set the field as NOT NULL

### WarpServer.Migration Actions

- add: add a new field to a schema
- modify: modify an existing field's data type
- rename: rename an existing field's name and data type (both are required)
- drop: drop an existing field

### Third-party Libraries

- [async](http://npmjs.com/package/async)
- [bcryptjs](http://npmjs.com/package/bcryptjs)
- [body-parser](http://npmjs.com/package/body-parser)
- [cron](http://npmjs.com/package/cron)
- [express](http://npmjs.com/package/express)
- [moment-timezone](http://npmjs.com/package/moment-timezone)
- [multer](http://npmjs.com/package/multer)
- [mysql](http://npmjs.com/package/mysql)
- [promise](http://npmjs.com/package/promise)
- [underscore](http://npmjs.com/package/underscore)