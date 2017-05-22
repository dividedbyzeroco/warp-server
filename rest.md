Warp Server REST API
====================

After building your very own **[Warp Server](readme.md)**, you'll now be able to use the powerful features of the `Warp Server REST API`. The REST API provides several endpoints which you can access via standard HTTP/HTTPS. These endpoints help you seemlessly manage your backend via your client-side code.

In order to help simplify the API, we have developed several client-side SDK's which you can use for your applications:

- **[JavaScript SDK](http://github.com/dividedbyzeroco/warp-sdk-js)**
- Android SDK (coming soon)
- iOS SDK (coming soon)
- Xamarin SDK (coming soon)

Often, you would only need to use the SDK's above, without having to worry about the REST API because they already do the work for you. If, however, the technology you are building on is not included in the list above, you can read through the docs below for more information.

## Table of Contents
- **REST API**
    - **[Headers](#headers)**
    - **[Object API](#object-api)**
        - **[Objects](#objects)**
            - **[Headers](#headers)**
            - **[Creating Objects](#creating-objects)**
            - **[Updating Objects](#updating-objects)**
            - **[Deleting Objects](#deleting-objects)**
            - **[Fetching Objects](#fetching-objects)**
            - **[Pointers as Keys](#pointers-as-keys)**
            - **[Retrieving Model Keys](#Retrieving-model-keys)**
            - **[Uploading Files](#uploading-files)**
            - **[Deleting Files](#deleting-files)**
            - **[Incremental Values](#incremental-values)**
        - **[Queries](#queries)**
            - **[Constraints](#constraints)**
            - **[Subqueries](#subqueries)**
            - **[Limit](#limit)**
            - **[Sorting](#sorting)**
            - **[Including Pointer Keys](#including-pointer-keys)**
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
- **[References](references.md)**

## Headers

When making HTTP requests to the API, it is important to include the API Key in order for it to be authorized. To do so, remember to set the `X-Warp-API-Key` header for your request:

`X-Warp-API-Key: 12345678abcdefg`

Often times, once a user has logged in, it is also important to place the `X-Warp-Session-Token` header in order to use certain operations only accessible to authorized users:

`X-Warp-Session-Token: fhwcunf2uch20j631`

For more information about session tokens, please see the section regarding [Logging In](#logging-in).

Optionally, Warp also allows you set extra headers in order to better describe your request to the server:

- `X-Warp-Client` describes the source of the request (e.g. `REST`, `Android`, `iOS`)
- `X-Warp-Version` describes the SDK version of the client request (note: only used with SDK's, e.g. `Android`, `iOS`)
- `X-App-Version` describes the version of the app that made the request

For more information about additional headers, please see the section regarding [Models](readme.md#models) and [Functions](readme.md#functions).

## Object API

The Object API makes it easy to handle operations being made to Objects. After initializing the server by following the instructions above, the following endpoints are readily made available for use by client-side applications.

### Objects

Objects represent individual instances of models. In terms of the database, an Object can be thought of as being a `row` in a table. Throughout the Warp Framework, Objects are the basic vehicles for data to be transmitted to and fro the server.

Each Object contains different keys which can be set or retrieved as needed. Among these keys are three special ones:

- id: a unique identifier that distinguishes an object inside a table
- created_at: a timestamp that records the date and time when a particular object was created (UTC)
- uppdated_at: a timestamp that records the date and time when a particular object was last modified (UTC)

These keys are specifically set by the server and cannot be modified by the user.

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


### Retrieving Model Keys

NOTE: Retrieving object keys is only accessible via the master key. Internal keys such as `id`, `created_at`, and `updated_at` are not included by default.
To retrieve keys for a specific model, execute a GET request to:

`/classes/{CLASS_NAME}`

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'X-Warp-Master-Key: abcdefg12345678' \
http://localhost:3000/api/1/classes/alien/keys
```

The expected response would be similar to the following:

```json
{
    "status": 200,
    "message": "Success",
    "result": {
        "viewable": ["name", "age", "type", "planet"],
        "actionable": ["name", "age", "type", "planet"],
        "pointers": {
            "planet": {
                "className":"planet",
                "via":"planet_id"
            }
        }
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


### Incremental Values

For keys which are of type `Integer`, you can adjust their relative value using `increment objects`. So instead of passing an integer value, you would pass something similar to the following:

`{ "type": "Increment", "value": {POSITIVE INTEGER (increase) OR NEGATIVE INTEGER (decrease)}}`

For example:

```bash
curl -X PUT \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"name":"The Doctor", "regenerations": { "type": "Increment", "value": 1 }}' \
http://localhost:3000/api/1/classes/alien/1
```

NOTE: In order for this to work, the model must specify the key's `Validator` and `Parser` as `Integer`.

For example, inside your `Alien` model, you must add the following validation and parser:

```javascript
// ...previous model details
validate: {
    regenerations: WarpServer.Model.Validation.Integer
},
parse: {
    regenerations: WarpServer.Model.Parser.Integer
}
// ...succeeding model details
```

For more info, see the [References](references.md) section.


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
- inx: contained in array, or is null
- str: starts with the specified string
- end: ends with the specified string
- has: contains the specified string  (to search multiple keys, separate the key names with `|`)
- fi: found in the given subquery, for more info, see the [Subqueries section](#subqueries)
- fie: found in either of the given subqueries, for more info, see the [Subqueries section](#subqueries)
- nfi: not found in the given subquery, for more info, see the [Subqueries section](#subqueries)
- nfe: not found in either of the given subqueries, for more info, see the [Subqueries section](#subqueries)

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'where={"age": {"gte": 20}, "type": {"in": ["dalek", "gallifreyan"]}}' \
http://localhost:3000/api/1/classes/alien
```

NOTE: When using constraints, the value of each constraint is automatically filtered before it is added to the query.

### Subqueries

There may be special cases when you would like to see if the value of a key exists in another query. For these scenarios, you can use the `fi` (Found in) and `nfi` (Not found in) constraints.

To use these constraints, all you need to do is specify the `className` and the `select` key which you want to check. Additionally, you can set `where` constraints, as well as `limit` and `skip` just as in regular queries. If no `limit` or `skip` is specified, the query searches the entire backend. 

For example, if you want to check whether an alien's planet is part of the friendly planets list, you would add the following constraint:

```javascript
{
    'planet': {
        'fi': {
            className: 'planet',
            select: 'id',
            where: {
                'type': {
                    'eq': 'friendly'
                }
            }
        }
    }
}
```

To query the API, you would do the following:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'where={"planet": {"fi": { "className" : "planet", "select": "id", "where": { "type": { "eq" : "friendly" }}}}}' \
http://localhost:3000/api/1/classes/alien
```

To see if a value is present in either of several subqueries:

```javascript
{
    'planet': {
        'fie': [
            {
                className: 'planet',
                select: 'id',
                where: {
                    'type': {
                        'eq': 'friendly'
                    }
                }
            },
            {
                className: 'planet',
                select: 'id',
                where: {
                    'type': {
                        'eq': 'good'
                    }
                }
            }
        ]
    }
}
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

### Including Pointer Keys

In order to include keys that belong to a `pointer`, we can use the `include` parameter.

For example:

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'include=["planet.name","planet.color"]' \
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
        "planet": {
            "type": "Pointer",
            "className": "planet",
            "id": 1,
            "attributes": {
                "name": "Gallifrey",
                "color": "brown"
            }
        },
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T23:21:18Z"
    },
    {
        "id": 13,
        "name": "Wormwood",
        "age": 80,
        "type": "extraterrestrial",
        "planet": null,
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T23:21:18Z"
    },
    {
        "id": 141,
        "name": "Straxx",
        "age": 300,
        "type": "sontaran",
        "planet": {
            "type": "Pointer",
            "className": "planet",
            "id": 1,
            "attributes": {
                "name": "Sontar",
                "color": "green"
            }
        },
        "created_at": "2016-05-12T22:11:09Z",
        "updated_at": "2016-05-12T23:21:18Z"
    }]
}
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

alternatively, you can use the email instead of the username

`{ "email": "{EMAIL}", "password": "{PASSWORD}" }`

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