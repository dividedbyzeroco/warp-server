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

## Other Resources
- **[REST API](rest.md)**
- Software Developer Kits (SDK's) 
    - **[JavaScript SDK](http://github.com/jakejosol/warp-sdk-js)**
    - Android SDK (coming soon)
    - iOS SDK (coming soon)
    - Xamarin SDK (coming soon)
- Command Line Tools
    - **[Warp Tools](http://github.com/jakejosol/warp-tools)**

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

Once completed, we can now use the Object API to operate on `alien` objects. See the section regarding the [Object API](rest.md#object-api) for more info.

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

By default, the pointer is joined using the `via` key of the class, and the `id` key of the pointer. However, there might be cases when the joins may not be as straightforward. For these scenarios, you can specify the `where` option.
The `where` option allows you to set special rules in order to connect to your pointer.

For example:

```javascript
// Some code defining our model
keys: {
    viewable: ['name', 'age', 'type', 'planet'],
    actionable: ['name', 'age', 'type', 'planet'],
    pointers: {
        'planet': {
            className: 'planet',
            via: 'planet_id',
            where: {
                'planet_id': {
                    '_eq': 'planet.id'
                },
                'type': {
                    '_eq': 'planet.race'
                }
            }
        }
    }
},
// Additional code defining our model
```

Note that the `where` option accepts a mapping of constraints.

Available Constraints:

- eq: equal to
- neq: not equal to
- gt: greater than
- gte: greater than or equal to
- lt: less than
- lte: less than or equal to
- ex: is not null/is null (value is either true or false)
- in: contained in array
- nin: not contained in array
- str: starts with the specified string
- end: ends with the specified string
- has: contains the specified string (to search multiple keys, separate the key names with `|`)

By default, the value of each constraint is automatically filtered before it is added to the query. If you want to specify a raw field name as a value, you must append an underscore `_` before the constraint name.

Unfiltered constraints:

- _eq: equal to raw value
- _neq: not equal to raw value
- _gt: greater than raw value
- _gte: greater than or equal to raw value
- _lt: less than raw value
- _lte: less than or equal to raw value

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
We can now use the special user authentication and management operations made available by the [User API](rest.md#user-api).

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

You can now access the `migrations` API to start creating `schemas`. Please see section on the [Migration API](rest.md#migration-api) for more info.


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

The Functions are now ready to be called. For more info, see the section regarding the [Function API](rest.md#function-api).


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

The Queues are now ready to be used. For more info, see the section regarding the [Queue API](rest.md#queue-api).

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