# Warp

__Warp__ is a framework that helps you manage and query your database with ease. 

With `Warp`, you can:
- Define your `tables`
- Describe how your `columns` are parsed and validated
- Determine `triggers` that run before or after database operations are made
- Build `queries` to find the data that you need
- Run `functions` that handle complex logic
- Restrict access based on `user` details
- Implement a `restful` API using an `express` middleware

> NOTE: Currently, only `mysql` is supported. But database adapters for other databases are coming.

> NOTE: This documentation is only for versions 6+. For versions 5.* or legacy versions (i.e. versions < 5.0.0), see [readme-v5.md](readme-v5.md) or [readme-legacy.md](readme-legacy.md)

# Table of Contents
- **[Installation](#installation)**  
- **[Getting Started](#getting-started)**
    - **[Configuration Options](#configuration-options)**
- **[Classes](#classes)**
    - **[Defining a Class](#defining-a-class)**
    - **[Defining Keys](#defining-keys)**
    - **[Registering Classes](#registering-classes)**
- **[Users](#users)**
    - **[Defining a User class](#defining-a-user-class)**
    - **[Authentication](#authentication)**
- **[Relations](#relations)**
    - **[belongsTo](#belongs-to)**
    - **[hasMany](#has-many)**
- **[Objects](#objects)**
    - **[Creating an Object](#creating-an-object)**
    - **[Updating an Object](#updating-an-object)**
    - **[Incrementing Numeric Keys](#incrementing-numeric-keys)**
    - **[Using JSON Keys](#updating-json-keys)**
    - **[Destroying an Object](#destroying-an-object)**
- **[Queries](#queries)**
    - **[Creating a Query](#creating-a-query)**
    - **[Defining Constraints](#defining-constraints)**
    - **[Using Subqueries](#using-subqueries)**
    - **[Pagination](#pagination)**
- **[Triggers](#triggers)**
    - **[Before Save](#before-save)**
    - **[After Save](#after-save)**
    - **[Before Destroy](#before-destroy)**
    - **[After Destroy](#after-destroy)**
    - **[Before Query](#before-query)**
    - **[After Query](#before-query)**
- **[Functions](#functions)**
    - **[Creating a Function](#creating-a-function)**
    - **[Registering Functions](#registering-functions)**
- **[Restful API](#restful-api)**
    - **[via REST](#via-rest)**

# Installation

To install `Warp`, use the `npm install` command.

```javascript
npm install --save warp-server
```

As `Warp` uses advanced javascript features, you must transpile your project using a tool like [typescript](#http://www.typescriptlang.org). 

> NOTE: For `typescript`, Make sure to add the following in your `tsconfig.json` "compilerOptions".

```
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

# Getting Started

To start using `Warp`, you need to create an instance of it.

```javascript
import Warp from 'warp-server';

const databaseURI = 'mysql://youruser:password@yourserver.com:3306/yourdatabase?charset=utf8';

const service = new Warp({ databaseURI });

service.initialize();
```

In the example above, we created a new `Warp` service. We also defined how we would connect to our database by setting the `databaseURI` configuration. 

Aside from `databaseURI`, there are other options that you can configure for your `Warp` instance.

## Configuration Options

| Name              | Format           | Description                                                                                                    |
| ----------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| databaseURI       | [URI](#uri)      | URI of your database (required)                                                                                |
| persistent        | boolean          | State whether db pool connections are recycled or auto-disposed (default: `false`)                             |
| restful           | boolean          | State whether you want to use the REST API feature                                                             |
| apiKey            | string           | API key for your REST API (required if `restful` is true)                                                      |
| masterKey         | string           | Master key for your REST API (required if `restful` is true), __NOTE:__ Only admin users should know this key  |
| customResponse    | boolean          | State whether the response is going to be handled by Warp or passed to the next middleware (default: `false`)  |

## URI

The [URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) format follows the syntax below.

```
databaseURI: 'protocol://user:password@server:port/database?optionalParamter1=value&optionalParamter2=value'
```

By using a URI, we are able to define the connection definition, all in one string. Additionally, if you would like to use multiple connections for your application, such as defining master and slave databases, you can set the value as an array.

```
databaseURI: [
    {
        uri: 'protocol://user:password@server:port/database?optionalParamter1=value',
        action: 'write'
    },
    {
        uri: 'protocol://user:password@server:port/database?optionalParamter1=value&optionalParamter2=value',
        action: 'read'
    }
]
```

Note the other property called `action` that determines which sort of database operations are assigned to this connection. This can either be `read` or `write`. It is adivsable to only have one `write` connection. However, you can have multiple `read` connections.

```
databaseURI: [
    {
        uri: 'protocol://user:password@server:port/database?optionalParamter1=value',
        action: 'write'
    },
    {
        uri: 'protocol://user:password@server:port/database?optionalParamter1=value&optionalParamter2=value',
        action: 'read'
    },
    {
        uri: 'protocol://user:password@server:port/database?optionalParamter1=value&optionalParamter2=value',
        action: 'read'
    }
]
```

# Classes

A `Class` is a representation of a `table` inside the database. Inside the `Class` are `keys`, which represent how columns in the database are parsed and formatted.

For example, a `dog` table will have a corresponding class called `Dog` that has different `keys` such as __name__, __age__, __height__, and __weight__.

Among these `keys` are three special ones that are automatically set by the server and cannot be manually edited.

- `id`: a unique identifier that distinguishes an object inside a table
- `createdAt`: a timestamp that records the date and time when an object was created (UTC)
- `updatedAt`: a timestamp that records the date and time when an object was last modified (UTC)

> NOTE: Be sure to have `id`, `created_at`, and `updated_at` fields in your table to avoid conflicts.

> NOTE: Aside from the three keys above, you also need to make sure that the table has a `deleted_at` field for deletion operations.

## Defining a Class

To create a Class, simply extend from `Warp.Class`.

```javascript
import { Class, define } from 'warp-server';

@define class Dog extends Class { }
```

In the example above, you can see that we defined a new class called `Dog`. Using the `@define` decorator, we tell `Warp` that the table name for this is `dog` (i.e., The `snake_case` version of the class name).

If we wanted the class name to be different from the table name, we can define it manually.

```javascript
@define({ className: 'dog', source: 'canine' })
class Dog extends Class { }
```

We now have a class name of `dog` that points to a table called `canine`. The class name is the one used to define the routes in our `restful API`. For more information, see the [restful API](#restful-API) section.

## Defining Keys

Now, let's add in some `keys` to our `Class`.

```javascript
import { Class, define, key } from 'warp-server';

@define class Dog extends Class {

    @key name: string;
    @key age: number;
    @key height: number;
    @key weight: number;

    get bmi(): number {
        return this.weight / (this.height * this.height);
    }

}
```

In order to add our keys, we defined them as properties inside the `Class`. It's worth mentioning that we used the `@key` decorator to tell `Warp` that the properties are columns. Otherwise, they would simply be ignored during database operations. 

In this example, since the `bmi` proeprty is not defined as a key, then it is ignored when we're saving, destroying or querying `Dog`.

Aside from informing `Warp` that the `keys` are columns, the `@key` decorator also infers the data type of the field based on its `typescript` type. By doing so, it validates and parses the fields automatically.

> NOTE: You do not need to include __id__, __createdAt__, and __updatedAt__ keys because they are already defined in `Class`.

> NOTE: We used `camelCase` format for the properties. Inside the database, we expect the columns to be in `snake_case` format. If this were shown as a table, it would look similar to the following.

Table: __Dog__

| id     | name     | age      | height     | weight       | created_at          | updated_at          | deleted_at  |
| ------ | -------- | -------- | -----------| ------------ | ------------------- | ------------------- | ----------- |
| 1      | Bingo    | 4        | 1.5        | 43.2         | 2018-03-09 12:38:56 | 2018-03-09 12:38:56 | null        |
| 2      | Ringo    | 5        | 1.25       | 36           | 2018-03-09 12:38:56 | 2018-03-09 12:38:56 | null        |

## Registering Classes

Now that we've created our `Class`, we can start using it in our application. For more information, see the [Objects](#objects) section. However, if you are using the `restful API` feature and want the class to be recognized, we need to register it.

To do so, simply use the `classes.register()` method.

```javascript
const service = new Warp({ /** some configuration **/ });

@define class Dog extends Class { /** shortened for brevity **/ }

service.classes.register({ Dog });
```

The `classes.register()` accepts a mapping of classes, so you can add several classes at once.

```javascript
@define class Dog extends Class { /** shortened for brevity **/ }
@define class Cat extends Class { /** shortened for brevity **/ }

service.classes.register({ Dog, Cat });
```

# Users

In most applications, a `user` table is usually defined and is often used to authenticate whether certain parts of the app are accessible. For `Warp` there is a built-in `User` class that you can extend from to define your `user` table.

## Defining a User class

To define a user, simply extend the `Warp.User` class.

```javascript
import Warp, { define, key } from 'warp-server';

@define class User extends Warp.User {

    @key firstName: string;
    @key lastName: string;

}
```

Because `User` is a special class, it has pre-defined `keys` that are helpful for authentication and authorization.

+ `username`: a unique string used for auth
+ `email`: a valid email address that can be used for verification
+ `password`: a secret string used for auth
+ `role`: a string defining the access level of a user

In addition, the `User` class has built-in `Triggers` that check whether the supplied `username` and `email` keys are valid and unique. It also prevents users from retrieving the raw `password` field, as well as ensuring that database operations to the `user` are only made by the `user` itself or by administrators using `master` mode.

## Authentication

Starting from version __6.0.0__, `Warp` no longer implements its own auth mechanism. However, this now opens up an opportunity for developers to make use of other popular and stable implementations such as [passport](https://npmjs.org/package/passport), OAuth2, and OpenID Connect.

Ideally, you would use an `auth` library or middleware to authenticate and retrieve the user from the database. Afterwards, you can map the user identity to your defined `User` class and use this class for database operations.

```javascript
// Define Warp service
const service = new Warp({ /** some configuration **/ });

// Define User
class User extends Warp.User { /** shortened for brevity **/ }

// A middleware that maps req.user before reaching service.router
const mapUser = (req, res, next) => {
    // We assume req.user is an object containing user details
    req.user = new User(req.user);
    next();
};

// Use the middleware
req.use('/api/', someAuthMiddleware, mapUser, service.router);

```

By default, the `restful API` tries to get the `req.user` parameter

# Relations

One of the biggest features of relational databases is their ability to define `relations` between tables. This makes it more convenient to link and retrieve entities.

For `Warp` there are several built-in decorators for defining `relations` in your database, which make querying much easier.

## belongsTo

If two tables have a `one-to-many` relation, you can use the `@belongsTo` decorator. This decorator allows you to define from which class your `key` belongs to. 

Later on, when you're querying, the key will automatically return an instance of the `Class` that you defined. Additionally, it validates whether the value you set to your `key` matches the correct `Class`.

```javascript
import { Class, key, belongsTo } from 'warp-server';

@define class Department extends Class { /** shortened for brevity */ }

@define class Employee extends Class {

    @key name: string;
    @belongsTo(() => Department) department: Department;

}
```

> NOTE: The `@belongsTo` decorator's first argument accepts a function that returns a `Class`. We use a function instead of directly setting the class because it helps us avoid problems with `circular` referencing in JavaScript.

In the example above, we tell `Warp` that our `department` key belongs to the `Department` class. 

Inside our database, every time we save or query `Employee`, it automatically maps the column `employee.department_id` to `department.id`.

If you want to define a different column for the mapping, you can set it using the second argument.

```javascript
import { Class, key, belongsTo } from 'warp-server';

@define class Department extends Class { /** shortened for brevity */ }

@define class Employee extends Class {

    @key name: string;

    @belongsTo(() => Department, { from: 'employee.deparment_code', to: 'department.code' }) 
    department: Department;

}
```

Now, that we've defined our relation, you can start using it in our code.

Below is an example of querying with `@belongsTo`. For more information on queries, see the [Queries](#queries) section.

```javascript
const service = new Warp({ /** some configuration **/ });

// Create a query
const employeeQuery = new Query(Employee)
    .include('department.name');

// Get employee
const employee = await service.classes.first(employeeQuery);

// employee.department is an instance of the `Department` class
// so you can even retrieve the department's name
const departmentName = employee.department.name;
```

Another example can be found below, this time it's about saving with `@belongsTo`. For more information on saving and destroying objects, see the [Objects](#objects) section.

```javascript
const employee = new Employee;
employee.department = new Department(1); // OK
employee.department = new Country(3); // This will cause an error

await service.classes.save(employee);
```

# Objects

An `Object` is the representation of a single `row` inside a table.

For example, a `Dog` class can have an instance of an `Object` called __corgi__, that has different properties such as __name__, __age__, and __weight__.

### Creating an Object

To create an `Object`, simply instantiate the `Class`.

```javascript
// Define the class
@define class Dog extends Class {

    @key name: string;
    @key age: number;
    @key height: number;
    @key weight: number;
    @key awardsWon: number;

    @belongsTo(() => Person) owner: Person;

    get bmi(): number {
        return this.weight / (this.height * this.height);
    }

}

// Instantiate the class
const corgi = new Dog;
```

You can set the values of its `keys` using the properties you defined.

```javascript
corgi.name = 'Bingo';
corgi.age = 5;
corgi.weight = 32.5;
corgi.owner = new Person(5); // person with id `5`
```

It also validates if you provide wrong data types.

```javascript
corgi.weight = 'heavy'; // This will cause a validation error
```

Alternatively, you can define the values of `keys` inside the object constructor.

```javascript
const corgi = new Dog({ name: 'Bingo', age: 5, weight: 32.5 });
```

> NOTE: The validation of data types still works when using the object constructor approach

Once you've finished setting your `keys`, you can now save the `Object` using the `classes.save()` method.

```javascript
import Warp from 'warp-server';

// Instantiate Warp
const service = new Warp({ /** some configuration */ });

(async () => {
    // Make sure to initialize the service
    await service.initialize();

    // The save method is a promise, so you can await it
    await service.classes.save(corgi);
})();
```

> NOTE: We wrapped the code around an anonymous async function because the `initialize()` and `classes.save()` methods are asynchronous.

### Updating Objects

The `classes.save()` method inserts a new row if the object was just newly created. If, however, the object already exists (i.e. has an `id`), then it will update instead the values inside the row.

```javascript
// Prepare the object
const corgi = new Dog;
corgi.name = 'Bingo';
corgi.age = 5;
corgi.weight = 32.5;

// Save the object
await classes.save(corgi);

// Change a Key
corgi.weight = 35;

// Update the object
await corgi.save();
```

Alternatively, if you know the `id` of the row you want to update, then simply pass the id inside the `Class` constructor.

```javascript
const daschund = new Dog(25); // id is 25
daschund.name = 'Brownie';

// Save the object
classes.save(daschund);
```

Or pass the `id` along with other `keys` inside the constructor.

```javascript
const beagle = new Dog({ id: 32, name: 'River' });

// Save the object
classes.save(daschund);
```

## Incrementing Numeric Keys

If the key you are trying to update is defined as a `number` and you want to atomically increase or decrease its value without knowing the original value, you can opt to use the `classes.increment()` method.

For example, if you want to increase the age by 1, you would use the following code.

```javascript
// Increase awardsWon by 1
classes.increment(corgi, 'awards_won', 1);
```

Conversely, if you want to decrease a `number` key, you would use a negative value.

```javascript
// Decrease the weight by 5.2
classes.increment(corgi, 'weight', -5.2);
```

## Updating JSON Keys

Recently, relational databases have slowly introducted JSON data structures into their systems. This allows for more complex use cases which might have originally needed a NoSQL database to implement.

> NOTE: JSON data types are still in its early stages and performance has not yet been thoroughly investigated yet. Hence, only place mid to shallow JSON structures inside your databases for the time being.

### JSON Objects

If the node of the JSON data you want to modify is an object, you can use the `json().set()` method to update its value.

```javascript
// Define class
@define class Dog extends Class {

    /** other keys **/
    @key preferences: object;

}

// Create a new object
const labrador = new Dog;
labrador.preferences = { food: 'meat' };

// Save the object
await classes.save(labrador);

// Change preferences
classes.json(labrador, 'preferences').set('$.food', 'vegetables');

// Update the object
await classes.save(labrador);
```

Notice the first argument of the `set()` method. This represents the `path` of the JSON column that we want to modify. For more information, see the documentation of [path syntax](https://dev.mysql.com/doc/refman/8.0/en/json-path-syntax.html) on the MySQL website.

### JSON Arrays

If the node of the JSON data you want to edit is an array, you can use the `json().append()` method to add to its value.

```javascript
labrador.preferences = { toys: ['plushie', 'ball'] };

// Save the object
await classes.save(labrador);

// Append a new toy
classes.json(labrador, 'preferences').append('$.toys', 'bone');

// Update the object
await classes.save(labrador);
```

## Destroying an Object

If you want to delete an `Object`, you can use the `classes.destroy()` method.

```javascript
await classes.destroy(labrador);
```

> NOTE: In `Warp`, there is no hard delete, only soft deletes. Whenever an object is destroyed, it is preserved, but its `deleted_at` column is set to the current timestamp. During queries, the "deleted" objects are omitted from the results automatically. You do not need to filter them out.