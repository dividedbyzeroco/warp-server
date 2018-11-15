Warp REST API
====================

After implementing **[Warp](readme.md)**, you'll now be able to use the powerful features of the `Warp REST API`. The `REST API` provides several endpoints which help you seemlessly manage your backend.

## Table of Contents
- **REST API**
    - **[Implementing the Restful API](#implementing-the-restful-api)**
    - **[Headers](#headers)**
    - **[Classes API](#classes-api)**
        - **[Objects](#classes)**
            - **[Headers](#headers)**
            - **[Creating Objects](#creating-objects)**
            - **[Updating Objects](#updating-objects)**
            - **[Deleting Objects](#deleting-objects)**
            - **[Fetching Objects](#fetching-objects)**
            - **[Relations](#relations)**
            - **[Incrementing Numeric Keys](#incrementing-numeric-keys)**
        - **[Queries](#queries)**
            - **[Selecting Keys](#selecting-keys)**
            - **[Constraints](#constraints)**
            - **[Subqueries](#subqueries)**
            - **[Pagination](#pagination)**
    - **[Function API](#function-api)**
        - **[Running Functions](#running-functions)**

## Implementing the Restful API

After ensuring that the `restful` option is set to `true` when you instantiated `Warp`, you can now use the `router` inside of your `express` application.

```javascript
// Instantiate Warp
const service = new Warp({ /** some options **/ restful: true });

// Prepare express app
const app = express();

// Assign router to your desired route
app.use('/api', service.router);
```

## Headers

### API Key

When making requests to the `API`, always remember to include the `API Key` in order to authorize your request.

To do so, set the `X-Warp-API-Key` header of your request.

`X-Warp-API-Key: 12345678abcdefg`

### Master Key

If you are calling the `API` via a secure and trusted server, and want to perform an action as a `master`, you must include the `X-Warp-Master-Key`.

> WARNING: Never share this key with untrusted servers, and never use this on the client-side.

`X-Warp-Master-Key: secure12345678`

## Classes API

The `Classes API` makes it easy for you to find, create, update, and delete `Objects` in your `Classes`. 

### Objects

`Objects` represent individual instances of classes. In terms of the database, an Object can be thought of as being a `row` in a table. Throughout `Warp`, `Objects` are the basic vehicles for data to be transmitted to and fro the server.

### Creating Objects

To create an `Object` for a specific `Class`, execute a `POST` request to

`/classes/{CLASS_NAME}`

with a JSON Object that contains the keys of your new `Object`.

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

To update an `Object` for a specific `Class`, execute a `PUT` request to

`/classes/{CLASS_NAME}/{ID}`

with a JSON Object that contains the modified keys of your existing Object.

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
    "result": {
        "id": 141,
        "age": 300,
        "created_at": "2016-05-12T09:18:44Z",
        "updated_at": "2016-05-12T14:03:21Z"
    }
}
```

### Deleting Objects

To delete an `Object` for a specific `Class`, execute a `DELETE` request to

`/classes/{CLASS_NAME}/{ID}`

For example

```bash
curl -X DELETE \
-H 'X-Warp-API-Key: 12345678abcdefg' \
http://localhost:3000/api/1/classes/alien/29
```

The expected response would be similar to the following.

```json
{
    "result": {
        "id": 29,
        "rows": 1,
        "updated_at": "2016-05-12T22:11:09Z",
        "deleted_at": "2016-05-12T22:11:09Z"
    }
}
```

### Fetching Objects

To fetch a single `Object` for a specific `Class`, execute a `GET` request to:

`/classes/{CLASS_NAME}/{ID}`

For example

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
http://localhost:3000/api/1/classes/alien/13
```

The expected response would be similar to the following.

```json
{
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

### Relations

In order to pass `relation` keys when creating or updating an object, the keys must have a value similar to the following:

`{ "type": "Pointer", "class_name": "{CLASS_NAME}", "id": "{ID}" }`

For example

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"name":"The Doctor", "planet": { "type": "Pointer", "class_name": "planet", "id": 8 }}' \
http://localhost:3000/api/1/classes/alien
```

### Incrementing Numeric Keys

For keys which are `numeric`, you can increment their value without having to know their previous value by using `Increment`. 

Hence, instead of passing a numeric value, you would pass something similar to the following.

`{ "type": "Increment", "value": {POSITIVE INTEGER (increase) OR NEGATIVE INTEGER (decrease)}}`

For example

```bash
curl -X PUT \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"name":"The Doctor", "regenerations": { "type": "Increment", "value": 1 }}' \
http://localhost:3000/api/1/classes/alien/1
```

## Queries

There are certain scenarios when you may need to find more than one `Object` from a `Class`. In these scenarios, it would be convenient to use `Queries`. `Queries` allow you to find specific `Objects` based on a set of `constraints`.

To query `Objects` from a specific `Class`, execute a `GET` request to

`/classes/{CLASS_NAME}`

For example

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
http://localhost:3000/api/1/classes/alien
```

The expected response would be similar to the following.

```json
{
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

## Selecting Keys

By default, `Warp` fetches all of the visible `keys` in a `Class` (i.e. keys not marked as `@hidden`).

However, if we consider performance and security, it is recommended that we pre-define the `keys` we would like to fetch. This helps reduce the size of the data retrieved from the database, and reduce the scope of the data accessed.

To define the `keys` you want to fetch, use the `select` parameter.

For example

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'select=["id", "name", "age"]' \
http://localhost:3000/api/1/classes/alien
```

The expected response would be similar to the following:

```json
{
    "result": [
        {
            "id": 21,
            "name": "The Doctor",
            "age": 150000
        },
        {
            "id": 13,
            "name": "Wormwood",
            "age": 80
        }
    ]
}
```

If you want to include `keys` from `relation` keys. You __must__ include them in the `select` method. Otherwise, they won't be fetched from the database.

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'select=["id", "name", "age", "planet.name"]' \
http://localhost:3000/api/1/classes/alien
```

If, on the other hand, you plan on fetching all visible `keys`, __and__ include `relation` keys, you can use the `include()` method instead of having to call the `select()` method on all the `keys`.

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'include=["planet.name"]' \
http://localhost:3000/api/1/classes/alien
```

### Constraints

`Constraints` help filter the results of a specific query. In order to pass `constraints` inside a Query, set a `where` parameter with a JSON string containing all the constraints you wish to apply.

To specify constraints, use the following syntax

```json
{
    "{NAME_OF_KEY}": {
        "{NAME_OF_CONSTRAINT}": "{VALUE}"
    }
}
```

### Available constraints

- `eq`: equal to
- `neq`: not equal to
- `gt`: greater than
- `gte`: greater than or equal to
- `lt`: less than
- `lte`: less than or equal to
- `ex`: is not null/is null (value is either true or false)
- `in`: contained in array
- `nin`: not contained in array
- `inx`: contained in array, or is null
- `str`: starts with the specified string
- `end`: ends with the specified string
- `has`: contains the specified string
- `hasi`: contains either of the specified strings
- `hasa`: contains all of the specified strings
- `fi`: found in the given subquery, for more info, see the [Subqueries section](#subqueries)
- `fie`: found in either of the given subqueries, for more info, see the [Subqueries section](#subqueries)
- `fia`: found in all of the given subqueries, for more info, see the [Subqueries section](#subqueries)
- `nfi`: not found in the given subquery, for more info, see the [Subqueries section](#subqueries)
- `nfe`: not found in either of the given subqueries, for more info, see the [Subqueries section](#subqueries)
- `nfea`: not found in all of the given subqueries, for more info, see the [Subqueries section](#subqueries)

For example

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'where={"age": {"gte": 20}, "type": {"in": ["dalek", "gallifreyan"]}}' \
http://localhost:3000/api/1/classes/alien
```

### Subqueries

There may be special cases when you would like to see if the value of a key exists in another query. For these scenarios, you can use the `fi` (Found in) and `nfi` (Not found in) constraints.

To use these constraints, all you need to do is specify the `class_name` and the `select` key which you want to check. Additionally, you can set `where` constraints, as well as `limit` and `skip` just as in regular queries. If no `limit` or `skip` is specified, the query searches the entire table. 

For example, if you want to check whether an alien's planet is part of the friendly planets list, you would add the following constraint.

```javascript
{
    'planet': {
        'fi': {
            class_name: 'planet',
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

To query the API, you would do the following.

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'where={"planet": {"fi": { "class_name" : "planet", "select": "id", "where": { "type": { "eq" : "friendly" }}}}}' \
http://localhost:3000/api/1/classes/alien
```

To see if a value is present in either of several subqueries

```javascript
{
    'planet': {
        'fie': [
            {
                class_name: 'planet',
                select: 'id',
                where: {
                    'type': {
                        'eq': 'friendly'
                    }
                }
            },
            {
                class_name: 'planet',
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

To see if a value is present in all of several subqueries

```javascript
{
    'planet': {
        'fia': [
            {
                class_name: 'planet',
                select: 'id',
                where: {
                    'type': {
                        'eq': 'friendly'
                    }
                }
            },
            {
                class_name: 'planet',
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

To see if a value is __NOT__ present in either of several subqueries

```javascript
{
    'planet': {
        'nfe': [
            {
                class_name: 'planet',
                select: 'id',
                where: {
                    'type': {
                        'eq': 'friendly'
                    }
                }
            },
            {
                class_name: 'planet',
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

To see if a value is __NOT__ present in all of several subqueries

```javascript
{
    'planet': {
        'nfa': [
            {
                class_name: 'planet',
                select: 'id',
                where: {
                    'type': {
                        'eq': 'friendly'
                    }
                }
            },
            {
                class_name: 'planet',
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

### Pagination

By default, `Warp` limits results to the top `100` objects that satisfy the query criteria. In order to increase the limit, we can specify the desired value via the `limit` parameter. 

Also, in order to implement pagination for the results, we can combine `limit` with the `skip` parameter. The `skip` parameter indicates how many items are to be skipped when executing the query. In terms of performance, we suggest limiting results to a maximum of `1000` and use skip to determine pagination.

For example

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'limit=1000&skip=1000' \
http://localhost:3000/api/1/classes/alien
```

> TIP: We recommend using the sorting methods in order to retrieve predictable results. For more info, see the section below.

### Sorting

Sorting determines the order by which the results are returned. They are also crucial when using the limit and skip parameters. To sort the query, use the `sort` parameter.

```json
["NAME_OF_KEY", "-PREPEND_WITH_DASH_FOR_DESCENDING_KEY"]
```

For example

```bash
curl -X GET \
-G \
-H 'X-Warp-API-Key: 12345678abcdefg' \
--data-urlencoded 'sort=["type","-age"]' \
http://localhost:3000/api/1/classes/alien
```

### Running Functions

To run a `Function`, execute a `POST` or `GET` request to:

`/functions/{FUNCTION_NAME}`

with a JSON Object that contains the keys for your request:

`{"{KEY1}": "{VALUE1}", "{KEY2}": "{VALUE2}"}`

For example

```bash
curl -X POST \
-H 'X-Warp-API-Key: 12345678abcdefg' \
-H 'Content-Type: application/json' \
--data '{"type": "dalek"}' \
http://localhost:3000/api/1/functions/destroy-aliens
```

The expected response would be similar to the following.

```json
{
    "status": 200,
    "message": "Success",
    "result": "Destroyed all `dalek` aliens" 
}
```