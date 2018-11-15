# Warp Server

__Warp Server__ is an `express` middleware that implements an easy-to-use API for managing and querying data from your database.

Currently, `Warp Server` uses `mysql@5.7` as its database of choice, but can be extended to use other data storage providers.

> NOTE: This readme is being updated for version 5.0.0. For the legacy version (i.e. versions < 5.0.0), see [readme-legacy.md](readme-legacy.md)

# Table of Contents
- **[Installation](#installation)**  
- **[Configuration](#configuration)**
    - **[Configuration Options](#configuration-options)**
- **[Classes](#classes)**
    - **[Creating a Class](#creating-a-class)**
    - **[Using an Alias](#using-an-alias)**
    - **[Using Pointers](#using-pointers)**
    - **[Defining Key Types](#defining-key-types)**
    - **[Setters and Getters](#setters-and-getters)**
    - **[Before Save](#before-save)**
    - **[After Save](#after-save)**
    - **[Before Destroy](#before-save)**
    - **[After Destroy](#after-save)**
    - **[Adding the Class](#adding-the-class)**
- **[Authentication](#authentication)**
    - **[Creating a User class](#creating-a-user-class)**
    - **[Creating a Session class](#creating-a-session-class)**
    - **[Setting the Auth classes](#setting-the-auth-classes)**
- **[Functions](#functions)**
    - **[Create a Function](#creating-a-function)**
    - **[Adding a Function](#adding-a-function)**
- **[Using the API](#using-the-api)**
    - **[via REST](#via-rest)**
    - **[via JavaScript SDK](#via-javascript-sdk)**

# Installation

To install Warp Server, simply run the following command:

```javascript
npm install --save warp-server
```

# Configuration

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

// Initialize the api
api.initialize();

// Apply the Warp Server router to your preferred base URL
var app = express();
app.use('/api/1', api.router);
```

> NOTE: Warp Server uses modern node features. We recommend using TypeScript as your transpiler. If you are transpiling via Babel, be sure to target at least Node 6.

Sample `.babelrc`

```json
{
    "presets": [
      "stage-0",
      [
        "env", {
          "targets": {
            "node": "6"
          }
        }
      ]
    ]
}
```

## Configuration Options

Warp Server accepts several configuration options that you can fully customize.

| Name              | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| apiKey            | API key for your Warp Server (required)                                              |
| masterKey         | Master key for your Warp Server (required), NOTE: Only super users should know this! |
| databaseURI       | URI of your database (protocol://user:password@server:port/database)                 |
| requestLimit      | Number of requests allowed per second (default: 30)                                  |
| sessionDuration   | Validity duration of a logged in user's session (default: '2 years')                 |
| keepConnections   | Determine whether db pool connections are kept alived or auto-disconnected (boolean) |
| charset           | Charset encoding of database queries (default: 'utf8mb4_unicode_ci')                 |
| passwordSalt      | Customize the password salt for log-ins (default: 8)                                 |
| customResponse    | Determine whether the response is going to be handled manually or automatically      |
| supportLegacy     | Support legacy features such as `className` instead of `class_name`                  |

# Classes

A `Class` is a representation of a `table` inside a database. By defining a class, you can determine how fields, known as `Keys` in Warp, are parsed and formatted.

For example, a `dog` table will have a corresponding class called `Dog` that has different `Keys` such as __name__, __age__, and __weight__.

Among these `Keys` are three special ones that are automatically set by the server and cannot be manually edited.

- `id`: a unique identifier that distinguishes an object inside a table
- `created_at`: a timestamp that records the date and time when an object was created (UTC)
- `updated_at`: a timestamp that records the date and time when an object was last modified (UTC)

> NOTE: Be sure to have `id`, `created_at`, `updated_at`, and `deleted_at` fields on your table in order for Warp Server to work with them.

## Creating a Class

To create a Class, simply extend from `WarpServer.Class`.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }
}
```

From the example above you can see a couple of properties that you need to declare in order for your Class to work. 

First, you need to declare the table that the Class is representing. For this, you create a static getter called `className` that returns the name of the table. 

Then, you need to decalre the Keys that the table is composed of. For that, you create a static getter called `keys`, which returns an array of their names. Note that you do not include __id__, __created_at__, and __updated_at__ keys in this area.

If this were shown as a table, it would look similar to the following.

Table: __Dog__

| id     | name     | age      | weight       | created_at          | updated_at          |
| ------ | -------- | -------- | ------------ | ------------------- | ------------------- |
| 1      | Bingo    | 4        | 33.2         | 2018-03-09 12:38:56 | 2018-03-09 12:38:56 |
| 2      | Ringo    | 5        | 36           | 2018-03-09 12:38:56 | 2018-03-09 12:38:56 |

## Using an Alias

If you need to make an alias for your table in situations where the table name is not suitable, you can define the alias as the `className` and then declare a static getter `source` returning the real name of the table.

```javascript
// Import Class from Warp Server
import { Class } from 'warp-server';

class Bird extends Class {

    static get className() {
        return 'bird';
    }

    static get source() {
        return 'avian';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }
}
```

## Using Pointers

For relational databases like MySQL, a foreign key is a fairly common concept. It represents a link to another table that acts as its parent.

For example, a `dog` table can have a `location_id` foreign key that points to the `location` table. In terms of Warp, this would mean that the `dog` class would have a pointer to the `location` class.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';

class Location extends Class {

    static get className() {
        return 'location';
    }

    static get keys() {
        return ['city', 'country'];
    }
}

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight', Location.as('location')];
    }
}
```

In the above example, you can see that a new `key` has been added to `dog`, called `location`. 

We use the extended class `Location` in order to create a new key via the `.as()` method. This means that for our endpoints, we can now interact with the `dog`'s location using the alias `location`.

For more information about endpoints, visit the [Using the API](#using-the-api) section.

### Secondary Pointers

If you also want to include a pointer from another pointer, you can do so via the `.from()` method. For example, if `location` had a pointer to a `country` class, and you want to include that to your `dog` class, you would do the following.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';

class Country extends Class {

    static get className() {
        return 'country';
    }
}

class Location extends Class {

    static get className() {
        return 'location';
    }

    static get keys() {
        return ['city', Country.as('country')];
    }
}

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return [
            'name', 
            'age', 
            'weight', 
            Location.as('location'), 
            Country.as('country').from('location.country')
        ];
    }
}
```

> NOTE: Make sure the secondary pointer is declared after its source pointer

Now that you've defined the secondary pointer, you can now retrieve it via the endpoints. Note that you cannot manually set the value of a secondary pointer, you can only retrieve it.

## Defining Key Types

By default, Warp tries to save the values that you passed to the keys as-is. That means that there is no validation or parsing being done before it is sent to the database. In some cases, this would be fine. However, you may opt to define the keys' data types.

To define key types, use the `Key()` function from Warp Server.

```javascript
// Import Class and Key from WarpServer
import { Class, Key } from 'warp-server';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', Key('age').asNumber(1, 50), Key('weight').asFloat(2)];
    }
}
```

### Data Types

| Name          | Parameters                                             | Description                                                           |
| ------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| asString      | `minLength`?: number, `maxLength`?: number             | Declare the key as a string                                           |
| asDate        |                                                        | Declare the key as a date                                             |
| asNumber      | `min`?: number, `max`?: number                         | Declare the key as a number, allows the use of `Increment`            |
| asInteger     | `min`?: number, `max`?: number                         | Declare the key as an integer, allows the use of `Increment`          |
| asFloat       | `decimals`?: number, `min`?: `number`, `max?`: number  | Declare the key as a float, allows the use of `Increment`             |
| asJSON        | _*only available in MySQL 5.7+_                        | Declare the key as JSON, allows the use of `SetJson` and `AppendJson` |

### Increment

If a value has been defined as either a `number`, an `integer`, or a `float`, then its value can be incremented and decremented using a relative value. That means if the current value is `5`, for example, then incrementing by `1` will turn its value to `6`. Incrementing by `-1`, on the other hand, will turn its value to `4`.

### JSON

For databases that support JSON data types (MySQL 5.7+), Warp Server has reserved functions that directly manipulate the JSON values on the database. They are `SetJson` and `AppendJson`. By giving the Key name, the path you are trying to manipulate (See MySQL JSON docs for more information), and a value, you can easily `set` or `append` data into a table without the need to parse and format manually.

For more information about specials (`Increment`, `SetJson`, `AppendJson`), visit the [Using the API](#using-the-api) section.

## Setters and Getters

If the provided Key types are not suitable for your needs, you can manually define setters and getters for your keys. 

To define a setter, simply use the `camelCase` version of the key as its name.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight', 'dog_years'];
    }

    set dogYears(value) {
        if(value.length < 5)
            throw new Error('Dog years must be at least 5');

        this.set('dog_years', value);
    }
}
```

From the above example, you can see that you can throw an error when a value is not valid. Also, you can use the pre-built `.set()` method in order to set the value for the Object. Without it, the value will not be saved in the database.

Similar to the setter, you can define a getter by simply using the `camelCase` version of the key as its name.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight', 'dog_years'];
    }

    set dogYears(value) {
        if(value < 5)
            throw new Error('Dog years must be at least 5');

        this.set('dog_years', value);
    }

    get dogYears() {
        return this.get('dog_years') + ' years';
    }
}
```

By using the `.get()` method, you can retrieve the data that was stored and present it back to the response in a different format.

## Before Save

Additionally, if you need to manipulate the data before it is saved to the database, you can declare a `beforeSave()` method.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';
import somePromise from './some-promise';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }

    get weight() {
        return this.get('weight') * 2.2;
    }

    async beforeSave() {

        // isNew informs you whether the data being saved is new or just an update
        if(this.isNew) {
            // The request is trying to create a new object
        }
        else {
            // The request is trying to update an existing object
        }

        // You can use .get() as well as getters
        if(this.get('age') > 5 && this.weight > 120) {
            this.set('size', 'xl');
        }

        // Throw an error to prevent the object from being saved
        if(this.get('age') > 10 && this.weight < 90)
            throw new Error('The provided age and weight are not logical');

        // Await a promise before saving
        await somePromise;

        return;
    }
}
```

## After Save

If you need to manipulate the data after it is saved to the database, you can declare an `afterSave()` method. Note that works in the background after the response has been sent. Thus, anything returned or thrown in this area does not affect the response.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';
import somePromise from './some-promise';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }

    get weight() {
        return this.get('weight') * 2.2;
    }

    async afterSave() {
        // isNew informs you whether the data saved was new or just an update
        if(this.isNew) {
            // The request created a new object
        }
        else {
            // The request updated an existing object
        }

        // Throwing an error does nothing to the response
        throw new Error('The provided age and weight are not logical');
    }
}
```
## Before Destroy

If you need to manipulate the data before it is destroyed in the database, you can declare a `beforeDestroy()` method.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }

    get weight() {
        return this.get('weight') * 2.2;
    }

    async beforeDestroy() {

        // The only key available before destroy is the `id` key
        const age = this.get('age'); // === undefined

        // Throw an error to prevent the object from being destroyed
        if(this.id === 10)
            throw new Error('You cannot delete id 10!');

        // Await a promise before destroying
        await somePromise;

        return;
    }
}
```

## After Destroy

If you need to manipulate the data after it has been destroyed from the database, you can declare an `afterDestroy()` method. Note that works in the background after the response has been sent. Thus, anything returned or thrown in this area does not affect the response.

```javascript
// Import Class from WarpServer
import { Class } from 'warp-server';

class Dog extends Class {

    static get className() {
        return 'dog';
    }

    static get keys() {
        return ['name', 'age', 'weight'];
    }

    get weight() {
        return this.get('weight') * 2.2;
    }

    async afterDestroy() {

        // Throwing an error does nothing to the response
        throw new Error('You cannot delete a dog!');
    }
}
```

## Adding the Class

Right now, the Class you created is still not recognized by your Warp Server. To register its definition, use `.classes.add()`.

```javascript
// Add the Dog class
api.classes.add({ Dog });

// Apply the router after
app.use('/api/1', api.router);
```

`.classes.add()` accepts a mapping of Classes, so you can do the following.

```javascript
// Add multiple classes
api.classes.add({ Dog, Bird });

// Apply the router after
app.use('/api/1', api.router);
```

Now that you've added the Classes, once you start the server, you can begin accessing them via the `/classes` endpoint.

```bash
> curl -H 'X-Warp-API-Key=1234abcd' http://localhost:3000/api/1/classes/dog

{
    result: [
        {
            id: 1,
            name: "Bingo",
            age: 4,
            weight: 33.2,
            created_at: "2018-03-09T12:38:56.000Z",
            updated_at: "2018-03-09T12:38:56.000Z"
        },
        {
            id: 2,
            name: "Ringo",
            age: 5,
            weight: 36,
            created_at: "2018-03-09T12:38:56.000Z",
            updated_at: "2018-03-09T12:38:56.000Z"
        }
    ]
}
```

For more information about endpoints, visit the [Using the API](#using-the-api) section.

# Authentication

User authentication is a common concern for applications. Luckily, for Warp Server, this comes built-in. Aside from regular classes, there are two other special classes that make up the authentication layer of Warp.

## Creating a User class

A `User` represents individual people who log in and make requests to the server. To enable this feature, you would need to declare a new class which extends from `User`.

```javascript
// Import User from WarpServer
import { User as WarpUser } from 'warp-server';

class User extends WarpUser {

    static get className() {
        return 'user';
    }

}
```

By default, the User class already has pre-defined keys that are important for it to function properly.

- `username`: A unique identifier created by the user
- `email`: A unique email identified for the user
- `password`: An encrypted string that gets stored and validated during log-ins

These keys are required and your table must have columns defined for each. If, however, you declared these fields with different names in your table, you can opt to declare their corresponding names via the following methods.

```javascript
// Import User from WarpServer
import { User as WarpUser } from 'warp-server';

class User extends WarpUser {

    static get className() {
        return 'user';
    }

    static get usernameKey() {
        return 'unique_name';
    }

    static get emailKey() {
        return 'email_address';
    }

    static get passwordKey() {
        return 'secret_key';
    }
}
```

If you also want to place additional keys from your user table, you can do so by extending the class' `super.keys`.

```javascript
// Import User from WarpServer
import { User as WarpUser } from 'warp-server';

class User extends WarpUser {

    static get className() {
        return 'user';
    }

    static get keys() {
        return [...super['keys'], 'first_name', 'last_name', 'display_photo'];

        // If you do not have support for spread operators, use the following:

        // const keys = super.keys; 
        // return keys.concat('first_name', 'last_name', 'display_photo');
    }
}
```

## Creating a Session class

A `Session` represents a successful authentication of a user. They are created every time a user logs in, and destroyed every time they are logged out. For Warp Server, a Session's `accessToken` is often used to make requests to the server. This accessToken is validated and returned as the `currentUser` of the request. You can find more about this in the [Sessions](#sessions) section.

To enable this feature, you would need to declare a new class which extends from `Session`.

```javascript
// Import Session from WarpServer
import { Session as WarpSession } from 'warp-server';

class Session extends WarpSession {

    static get className() {
        return 'session';
    }

}
```

By default, like the User class, the Session class already has pre-defined keys that are important for it to function properly.

- `session_token`: A unique token every time a successful login occurs
- `origin`: The origin of the request (`js-sdk`, `android`, `ios`)
- `revoked_at`: Date until the session expires

These keys are required and your table must have columns defined for each. If, however, you declared these fields with different names in your table, you can opt to declare their corresponding names via the following methods.

```javascript
// Import Session from WarpServer
import { Session as WarpSession } from 'warp-server';

class Session extends WarpSession {

    static get className() {
        return 'user';
    }

    static get accessTokenKey() {
        return 'access_key';
    }

    static get originKey() {
        return 'requested_by';
    }

    static get revokedAtKey() {
        return 'expires_at';
    }
}
```

If you also want to place additional keys from your user table, you can do so by extending the class' `super.keys`.

```javascript
// Import Session from WarpServer
import { Session as WarpSession } from 'warp-server';

class Session extends WarpSession {

    static get className() {
        return 'session';
    }

    static get keys() {
        return [...super['keys'], 'ip_address', 'fcm_key'];

        // If you do not have support for spread operators, use the following:

        // const keys = super.keys; 
        // return keys.concat('ip_address', 'fcm_key');
    }
}
```

## Setting the Auth Classes

To set the newly defined auth classes, use the `.auth.set()` methods

```javascript
// Set auth classes
api.auth.set(User, Session);

// Apply the router after
app.use('/api/1', api.router);
```

# Functions

Ideally, you can perform a multitude of tasks using classes. However, for special operations that you need to perform inside the server, you can use `Functions`.

A `Function` is a piece of code that can be executed via a named endpoint. It receives input `keys` that it processes in order to produce a result.

## Create a Function

To create a Function, create a new class that extends the `Function`.

```javascript
// Import Function from Warp Server
import { Function } from 'warp-server';
import getDogsPromise from './get-dogs';

class GetFavoriteDogs extends Function {

    static get functionName() {
        return 'get-favorite-dogs';
    }

    static get masterOnly() {
        return false;
    }

    async run() {
        // collection_id was passed to the request
        const collectionID = this.get('collection_id');

        // Do some work here...
        const favoriteDogs = await getDogsPromise(collectionId);

        // Throw an error instead of a result
        throw new Error('Cannot get your favorite dogs');

        // Return the result
        return favoriteDogs;
    }
}
```

For the above example, you can see that you need to declare a `functionName` getter as well as a `run()` method. These are the only two things you need in order to create a function. 

However, you might notice the `masterOnly` getter declared atop. What does this does is just basically limits access to the function to masters (i.e. requests made using the `X-Warp-Master-Key`). You can omit this code, and by default is set to be `false`.

## Adding a Function

Right now, the Function you created is still not recognized by your Warp Server. To register its definition, use `.functions.add()`.

```javascript
// Add the GetFavoriteDogs function
api.functions.add({ GetFavoriteDogs });

// Apply the router after
app.use('/api/1', api.router);
```

`.functions.add()` accepts a mapping of Functions, so you can do the following.

```javascript
// Add multiple functions
api.functions.add({ GetFavoriteDogs, GetGoodDogs });
```

# Using the API

Now that you have set up your Warp Server API, you can start using it via either REST or the JavaScript SDK.

## via REST

To learn more about the REST API, visit the [REST](rest.md) documentation.

## via JavaScript SDK

To learn more about the JavaScript SDK, visit the [JavaScript SDK](https://github.com/dividedbyzeroco/warp-sdk-js) documentation.
