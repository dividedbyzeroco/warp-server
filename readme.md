Warp Server
===========

__Warp Server__ is a library for implementing the Warp Framework on Node.js. It consists of several classes which aim to produce endpoints easily accessible via a standard REST API. Currently, Warp Server uses `mysql` as its backend of choice and implements validators, parsers and formatters that can control the data coming in and out of the server.

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
var Warp Server = require('warp-server');

// Prepare config; You can also use process.env or store the config in a json file
var config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    default: 'default_table',
    apiKey: '12345678abcdefg'
};

// Create a Warp Server router for the API
var api = Warp Server.initialize(config);

// Apply the Warp Server router to your preferred base URL, using express' app.use() method
var app = express();
app.use('/api/1', api);
```

## Models

Models make it easy to define the tables found in the database. They contain special parameters which allow you to control the data that comes in and out of the server.

To define a Model, simply create a `Warp Server.Model` class with the following parameters:

```javascript
Warp Server.Model.create({
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
        '{KEY2}': Warp Server.Model.Validation.FixedString(8)
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
        '{KEY2}': Warp Server.Model.Parser.Integer
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
        '{KEY2}': Warp Server.Model.Parser.Date
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
var Alien = Warp Server.Model.create({
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
        'age': Warp Server.Model.Validation.PositiveInteger
    },
    parse: {
        'age': Warp Server.Model.Parser.Integer,
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

In order to tell Warp Server to use the model we just created, we must register it before we initialize Warp Server:

```javascript
// ... some config code here
Warp Server.Model.register(Alien);
var api = Warp Server.initialize(config);
// ... additional code to initialize here
```

We can now use the REST API to operate on `alien` objects. See the section regarding the REST API for more info.

## Pointers

Relations are a vital aspect of Relational Databases. With regards to the Warp Server, these are represented by `pointers`. Pointers are specific keys (fields) that point to a specific object from another table. This can be thought of as the `belongs_to` relationship or the `foreign_key` relationship in SQL databases. 

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

## User and Session Models

In order to handle user authentication and management, a special type of model called the User model can be added. It is similar to the `Warp Server.Model` except it requires a few additional fields.

Fields required by the User Model:
- username
- password
- email

For example, to create a User model using the `user` table:

```javascript
var User = Warp Server.Model.create({
    className: 'user',
    keys: {
        viewable: ['username', 'email'], // Note that password should not be viewable by the REST API
        actionable: ['username', 'password', 'email']
    },
    validate: {
        // Pre-defined validators are available for the fields required by the User Model
        // See the section on Pre-defined Validators for more info.
        'username': Warp Server.Model.Validation.FixedString(8, 16),
        'password': Warp Server.Model.Validation.Password(8),
        'email': Warp Server.Model.Validation.Email
    },
    parse: {
        // Pre-defined Parsers
        // See the section on Pre-defined Parsers for more info.
        'username': Warp Server.Model.Parser.NoSpaces,
        'password': Warp Server.Model.Parser.Password
    }
});
```

In order for us to use the defined model as a User model, we should use `.registerUser()` instead of the regular `.register()` method:

```javascript
// ... some config code here
Warp Server.Model.registerUser(User);
Warp Server.Model.register(Alien);
var api = Warp Server.initialize(config);
// ... additional code to initialize here
```

Aside from the User Model, we should also define a Session Model that, like the User Model, has special required fields:

- user (pointer)
- origin
- session_token

An example of a Session Model would be as follows:

```javascript
var Session = Warp Server.Model.create({
    className: 'session',
    keys: {
        viewable: [{ 'user': 'user_id' }, 'origin', 'session_token'], // Note that the user field is a pointer to the 'user' table
        actionable: [{ 'user': 'user_id'}, 'origin']
    },
    validate: {
        'user': Warp Server.Model.Validation.Pointer
    },
    
    // In order for us to generate special session tokens, we must use the Pre-defined PreSave function.
    // For more info on these pre-defined functions, please see the secion on PreSave functions.
    beforeSave: Warp Server.Model.PreSave.Session
});
```

Then, we register the created model by using the `.registerSession()` method:

```javascript
// ... some config code here
Warp Server.Model.registerUser(User);
Warp Server.Model.registerSession(Session);
Warp Server.Model.register(Alien);
var api = Warp Server.initialize(config);
// ... additional code to initialize here
```

We can now use the special user authentication and management operations made available by the REST API.

## Objects

Objects represent individual instances of models. In terms of the database, an Object can be thought of as being a `row` in a table. Throughout the Warp Framework, Objects are the basic vehicles for data to be transmitted to and fro the server.

Each Object contains different keys which can be set or retrieved as needed. Among these keys are three special ones:

- id: a unique identifier that distinguishes an object inside a table
- created_at: a timestamp that records the date and time when a particular object was created (UTC)
- uppdated_at: a timestamp that records the date and time when a particular object was last modified (UTC)

These keys are specifically set by the server and cannot be modified by the user.

## REST API

The REST API makes it easy to handle operations being made to Objects. After initializing the server by following the instructions above, the following endpoints are readily made available for use by client-side applications.

### Headers

When making HTTP requests to the REST API, it is important that the API Key is set. To do so, remember to set the `X-Warp-API-Key` header for your request:

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
- ex: is null/is not null (value is either true or false)
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
{
    "{NAME_OF_KEY}": "{1 (Ascending) or -1 (Descending)}"
}
```

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'sort={"type":1,"age":-1}' \
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

with a JSON Object that contains the user's username and password:

`{ "username": "{USERNAME}", "password": "{PASSWORD}" }`

