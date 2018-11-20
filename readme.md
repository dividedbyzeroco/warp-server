![Warp](warp-logo-full.png)

__Warp__ is an ORM for the scalable web.

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
    - **[Adding Key Modifiers](#adding-key-modifiers)**
    - **[Registering Classes](#registering-classes)**
- **[Users](#users)**
    - **[Defining a User class](#defining-a-user-class)**
    - **[Authentication](#authentication)**
- **[Relations](#relations)**
    - **[belongsTo](#belongsTo)**
    - **[hasMany](#hasMany)**
- **[Objects](#objects)**
    - **[Creating an Object](#creating-an-object)**
    - **[Updating an Object](#updating-an-object)**
    - **[Incrementing Numeric Keys](#incrementing-numeric-keys)**
    - **[Using JSON Keys](#updating-json-keys)**
    - **[Destroying an Object](#destroying-an-object)**
- **[Queries](#queries)**
    - **[Creating a Query](#creating-a-query)**
    - **[Selecting Keys](#selecting-keys)**
    - **[Defining Constraints](#defining-constraints)**
    - **[Using Subqueries](#using-subqueries)**
    - **[Pagination](#pagination)**
    - **[Sorting](#sorting)**
- **[Collections](#collections)**
    - **[Counting Collections](#counting-collections)**
    - **[Filtering Collections](#filtering-collections)**
    - **[Manipulating Collections](#manipulating-collections)**
    - **[Converting Collections](#converting-collections)**
- **[Triggers](#triggers)**
    - **[Before Save](#before-save)**
    - **[After Save](#after-save)**
    - **[Before Destroy](#before-destroy)**
    - **[After Destroy](#after-destroy)**
    - **[Before Find, First, Get](#before-find-first-get)**
- **[Functions](#functions)**
    - **[Creating a Function](#creating-a-function)**
    - **[Registering Functions](#registering-functions)**
- **[Restful API](rest.md)**

# Installation

To install `Warp`, use the `npm install` command.

```bash
npm install --save warp-server
```

As `Warp` uses advanced javascript features, you must transpile your project using a tool like [typescript](#http://www.typescriptlang.org).

For `typescript`, Make sure to add the following in your `tsconfig.json` "compilerOptions".

```
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

Also, you need to install and import the `reflect-metadata` library in order for `Warp` to properly define classes.

> NOTE: Remember to import `reflect-metadata` only once in your project, ideally in your main `index.ts` file.

```bash
npm install --save reflect-metadata
```

```javascript
import 'reflect-metadata';
```

# Getting Started

To start using `Warp`, we need to create an instance of it.

```javascript
import Warp from 'warp-server';

const databaseURI = 'mysql://youruser:password@yourserver.com:3306/yourdatabase?charset=utf8';

const service = new Warp({ databaseURI });

// Inititialize the service
service.initialize().then(() => { /** Start using the service here */ });
```

In the example above, we created a new `Warp` service. We also defined how we would connect to our database by setting the `databaseURI` configuration. 

> TIP: The `initialize()` method is asynchronous. Aside from using `.then()`, we can also use `await`.

```javascript
import Warp from 'warp-server';

const databaseURI = 'mysql://youruser:password@yourserver.com:3306/yourdatabase?charset=utf8';

const service = new Warp({ databaseURI });

// Wrap the service in an asynchronous function
(async () => {

    // Inititialize the service
    await service.initialize();

    /** Start using the service here */

})();
```

Aside from `databaseURI`, there are other options that we can configure for our `Warp` instance.

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

Now that we've initialized `Warp`, we can now start using it!

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

## Adding Key Modifiers

To enhance how keys are validated, parsed, and formatted, we can add `Key Modifiers`.

### @hidden

If you use the `restful API` and want to hide a key from the results, you can use the `@hidden` decorator.

```javascript
import { Class, define, key, hidden } from 'warp-server';

@define class Dog extends Class {

    @key name: string;
    @hidden @key secretName: string; // Will be omitted from query results

}
```

> NOTE: `secretName` can still be retrieved in the `Class` object. Only the results in the `restful API`, and the result of `dog.toJSON()` will have it hidden.

### @guarded

If you want to guard the key from being updated over the `restful API` or via the `Class` constructor, you can use the `@guarded` decorator.

```javascript
import { Class, define, key, guarded } from 'warp-server';

@define class Dog extends Class {

    @key name: string;
    @guarded @key eyeColor: string;

}

const daschund = new Dog;
dog.eyeColor = 'green'; // OK

const corgi = new Dog({ eye_color: 'brown' }); // Will throw an error
```

### @length

If you want to limit the length of a string key, you can use the `@length` decorator.

```javascript
import { Class, define, key, length } from 'warp-server';

@define class Dog extends Class {

    @length(3) name: string; // Minimum of 3 characters
    @length(0, 5) alias: string; // Maximum of 5 characters
    @length(3, 5) code: string; // Between 3 to 5 characters

}
```

### @min, @max, @between

If you want to limit the range of values for a number key, you can use the `@min`, `@max`, and `@between` decorators.

```javascript
import { Class, define, key, range } from 'warp-server';

@define class Dog extends Class {

    @min(3) age: number; // Minimum value of 3
    @max(5) height: number; // Maximum value of 5
    @between(3, 5.5) weight: number; // Between 3 to 5.5

}
```

### @rounded

If you want to add rounding to the value of a number key, you can use the `@rounded` decorator.

```javascript
import { Class, define, key, range } from 'warp-server';

@define class Dog extends Class {

    @rounded(2) weight: number; // Round to 2 decimals places

}
```

## Registering Classes

Now that we've created our `Class`, we can start using it in our application. For more information, see the [Objects](#objects) section. 

However, if you are using the `restful API` feature and want the class to be recognized, you need to register it.

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

In most applications, a `user` table is usually defined and is often used to authenticate whether certain parts of the app are accessible. For `Warp` there is a built-in `User` class that we can extend from to define our `user` table.

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

## @belongsTo

If two tables have a `one-to-many` relation, we can use the `@belongsTo` decorator. This decorator allows us to define from which class our `key` belongs to. 

Later on, when we're querying, the key will automatically return an instance of the `Class` that we defined. Additionally, it validates whether the value we set to our `key` matches the correct `Class`.

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

Now that we've defined our relation, we can start using it in our code.

Below is an example of querying with `@belongsTo`. For more information on queries, see the [Queries](#queries) section.

```javascript
const service = new Warp({ /** some configuration **/ });

// Create a query
const employeeQuery = new Query(Employee).include('department.name');

// Get employee
const employee = await service.classes.first(employeeQuery);

// employee.department is an instance of the `Department` class
// so we can even retrieve the department's name
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

For example, a `Dog` class can have an instance of an `Object` called `corgi`, that has different properties such as `name`, `age`, and `weight`.

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

We can set the values of its `keys` using the properties we defined.

```javascript
corgi.name = 'Bingo';
corgi.age = 5;
corgi.weight = 32.5;
corgi.owner = new Person(5); // person with id `5`
```

It also validates if we provide wrong data types.

```javascript
corgi.weight = 'heavy'; // This will cause a validation error
```

Alternatively, we can define the values of `keys` inside the object constructor.

```javascript
const corgi = new Dog({ name: 'Bingo', age: 5, weight: 32.5 });
```

> TIP: The validation of data types still works when using the object constructor approach. Also, `@guarded` keys will throw an error if you try to assign them using this approach.

Once we've finished setting our `keys`, we can now save the `Object` using the `classes.save()` method.

```javascript
// The save method is a promise, so we can await it
await service.classes.save(corgi);
```

> NOTE: Don't forget to `initialize()` before running `classes.save()` methods.

### Updating Objects

The `classes.save()` method inserts a new row if the object was just newly created. If, however, the object already exists (i.e. has an `id`), then it will update instead the values inside the row.

```javascript
// Prepare the object
const corgi = new Dog;
corgi.name = 'Bingo';
corgi.age = 5;
corgi.weight = 32.5;

// Save the object
await service.classes.save(corgi);

// Change a Key
corgi.weight = 35;

// Update the object
await corgi.save();
```

Alternatively, if we know the `id` of the row we want to update, use the `withId()` method.

```javascript
const daschund = Dog.withId<Dog>(25); // id is 25
daschund.name = 'Brownie';

// Update the object
await service.classes.save(daschund);
```

Or simply pass the id inside the `Class` constructor.

```javascript
const shitzu = new Dog(16); // id is 16
shitzu.name = 'Fluffy';

// Update the object
await service.classes.save(shitzu);
```

Or pass the `id` along with other `keys` inside the constructor.

```javascript
const beagle = new Dog({ id: 34, name: 'River' });

// Update the object
await service.classes.save(daschund);
```

## Incrementing Numeric Keys

If the key we are trying to update is defined as a `number` and we want to atomically increase or decrease its value without knowing the original value, we can opt to use the `classes.increment()` method.

For example, if we want to increase the age by 1, we would use the following code.

```javascript
// Increase awardsWon by 1
service.classes.increment(corgi, 'awards_won', 1);
```

Conversely, if we want to decrease a `number` key, we would use a negative value.

```javascript
// Decrease the weight by 5.2
service.classes.increment(corgi, 'weight', -5.2);
```

## Updating JSON Keys

Recently, relational databases have slowly introducted JSON data structures into their systems. This allows for more complex use cases which might have originally needed a NoSQL database to implement.

> NOTE: JSON data types are still in its early stages and performance has not yet been thoroughly investigated yet. Hence, only place mid to shallow JSON structures inside your databases for the time being.

### JSON Objects

If the node of the JSON data we want to modify is an object, we can use the `json().set()` method to update its value.

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
await service.classes.save(labrador);

// Change preferences
service.classes.json(labrador, 'preferences').set('$.food', 'vegetables');

// Update the object
await service.classes.save(labrador);
```

Notice the first argument of the `set()` method. This represents the `path` of the JSON column that we want to modify. For more information, see the documentation of [path syntax](https://dev.mysql.com/doc/refman/8.0/en/json-path-syntax.html) on the MySQL website.

### JSON Arrays

If the node of the JSON data we want to edit is an array, we can use the `json().append()` method to add to its value.

```javascript
labrador.preferences = { toys: ['plushie', 'ball'] };

// Save the object
await service.classes.save(labrador);

// Append a new toy
service.classes.json(labrador, 'preferences').append('$.toys', 'bone');

// Update the object
await service.classes.save(labrador);
```

## Destroying an Object

If we want to delete an `Object`, we can use the `classes.destroy()` method.

```javascript
await service.classes.destroy(labrador);
```

> NOTE: In `Warp`, there is no hard delete, only soft deletes. Whenever an object is destroyed, it is preserved, but its `deleted_at` column is set to the current timestamp. During queries, the "deleted" objects are omitted from the results automatically. You do not need to filter them out.

# Queries

Now that we have a collection of `Objects` inside our database, we would need a way to retrieve them. For `Warp`, we do this via `Queries`.

## Creating a Query

To create a query, wrap the `Class` inside a `Query`.

```javascript
import { Class, define, Query } from 'warp-server';

@define class Dog extends Class { /** shortened for brevity */ }

// Define the query
const dogQuery = new Query(Dog);
```

Once created, we can fetch the results via `classes.find()`.

```javascript
const dogs = await service.classes.find(dogQuery);
```

We now have a `Collection` of `Dog` objects. This collection helps us iterate through the different rows of the `dog` table. To learn more about collections, see the [Collections](#collections) section.

## Selecting Keys

By default, `Warp` fetches all of the visible `keys` in a `Class` (i.e. keys not marked as `@hidden`).

However, if we consider performance and security, it is recommended that we pre-define the `keys` we would like to fetch. This helps reduce the size of the data retrieved from the database, and reduce the scope of the data accessed.

To define the `keys` you want to fetch, use the `select()` method.

```javascript
// You can pass a single value
dogQuery.select('name');

// You can also pass an array
dogQuery.select(['name', 'age']);

// Or you can define multiple argumetns
dogQuery.select('name', 'age', 'weight');

// Or you can chain multiple select methods
dogQuery.select('name').select('age').select('weight');
```

If you want to include `keys` from `relation` keys. You __must__ include them in the `select()` method. Otherwise, they won't be fetched from the database.

```javascript
dogQuery.select('location.name');
```

If, on the other hand, you plan on fetching all visible `keys`, __and__ include `relation` keys, you can use the `include()` method instead of having to call the `select()` method on all the `keys`.

```javascript
dogQuery.include('location.name', 'location.address');
```

## Defining Constraints

Constraints help filter the results of a query. In order to pass constraints, use any of the following methods.

```javascript
// Prepare query
const dogQuery = new Query(Dog);

// Find an exact match for the specified key
dogQuery.equalTo('name', 'Bingo');
dogQuery.notEqualTo('name', 'Ringo');

// If the key is ordinal (i.e. a string, a number or a date), you can use the following constraints
dogQuery.lessThan('age', 21);
dogQuery.lessThanOrEqualTo('name', 'Zack');
dogQuery.greaterThanOrEqualTo('weight', 30);
dogQuery.greaterThan('created_at', '2018-03-12 17:30:00');

// If you need to check if a field is null or not null
dogQuery.exists('breed');
dogQuery.doesNotExist('breed');

// If you need to check if a given key is found in a list, you can use the following constraints
dogQuery.containedIn('breed', ['Malamute', 'Japanese Spitz']);
dogQuery.containedInOrDoesNotExist('breed', ['Beagle', 'Daschund']);
dogQuery.notContainedIn('age', [18, 20]);

// If you need to check if a key contains a string
dogQuery.startsWith('name', 'Bing');
dogQuery.endsWith('name', 'go');
dogQuery.contains('name', 'in');

// If you need to check if a key contains several substrings
dogQuery.containsEither('description', ['small','cute','cuddly']);

// If you need to check if a key contains all substrings
dogQuery.containsAll('name', ['big','brave','trustworthy']);
```

> TIP: Each constraint returns the query, so you can chain them, such as the following.

```javascript
const dogQuery = new Query(Dog)
    .greaterThanOrEqualTo('age', 18)
    .contains('name', 'go')
    .containedIn('breed', ['Malamute', 'Japanse Spitz']);
```

## Using Subqueries

The constraints above are usually enough for filtering queries; however, if the scenario calls for a more complex approach, you may nest queries within other queries.

For example, if we want to retrieve all the dogs who are residents of urban cities, we may use the `.foundIn()` method.

```javascript
// Prepare subquery
const urbanCityQuery = new Query(Location).equalTo('type', 'urban');

// Prepare main query
const dogQuery = new Query(Dog)
    .foundIn('location.id', 'id', urbanCityQuery);

// Get dogs
const dogs = await service.classes.find(dogQuery);
```

If we want to see if a value exists in either of multiple queries, we can use `.foundInEither()`.

```javascript
// Prepare subqueries
const urbanCityQuery = new Query(Location).equalTo('type', 'urban');
const ruralCityQuery = new Query(Location).equalTo('type', 'rural');

// Prepare main query
const dogQuery = new Query('dog')
    .foundInEither('location.id', [
        { 'id': urbanCityQuery }, 
        { 'id': ruralCityQuery }
    ]);

// Get dogs
const dogs = await service.classes.find(dogQuery);
```

If we want to see if a value exists in all of the given queries, we can use `.foundInAll()`.

```javascript
// Prepare subqueries
var urbanCityQuery = new Warp.Query('location').equalTo('type', 'urban');
var smallCityQuery = new Warp.Query('location').equalTo('size', 'small');

// Prepare main query
var dogQuery = new Warp.Query('dog')
    .foundInAll('location.id', [
        { 'id': urbanCityQuery }, 
        { 'id': smallCityQuery }
    ]);

// Get dogs
const dogs = await service.classes.find(dogQuery);
```

Conversely, you can use `.notFoundIn()`, `.notFoundInEither()`, and `.notFoundInAll()` to retrieve objects whose key is not found in the given subqueries.

## Pagination

By default, `Warp` limits results to the top `100` objects that satisfy the query criteria. In order to increase the limit, we can specify the desired value via the `.limit()` method. 

```javascript
dogQuery.limit(1000); // Top 1000 results
```

Also, in order to implement pagination for the results, we can combine `.limit()` with `.skip()`. The `.skip()` method indicates how many items are to be skipped when executing the query. In terms of performance, we suggest limiting results to a maximum of `1000` and use skip to determine pagination.

```javascript
dogQuery.limit(10).skip(20); // Top 10 results; Skip the first 20 results

dogQuery.limit(1000); // Top 1000 results
dogQuery.skip(1000); // Skip 1000 results
```

> TIP: We recommend using the sorting methods in order to retrieve predictable results. For more info, see the section below.

## Sorting

Sorting determines the order by which the results are returned. They are also crucial when using the limit and skip parameters. To sort the query, use the following methods.

```javascript
dogQuery.sortBy('age'); // Sorts the query by age, in ascending order
dogQuery.sortByDescending(['created_at', 'weight']); // You can also use an array to sort by multiple keys

// You can also enter the keys as separate parameters
dogQuery.sortByDescending('crated_at', 'weight');
```

# Collections

When using queries, the result returned is a `Collection` of `Objects`. `Collections` are a special iterable for `Warp` that allows you to filter, sort and manipulate list items using a set of useful methods.

## Counting Collections

To count the results, use the `length` property.

```javascript
// Prepare query
const dogQuery = new Query(Dog);

// Get dogs
const dogs = await service.classes.find(dogQuery);

// Gets the total count
const total = dogs.length;
```

## Filtering Collections

To filter the results and return a new collection based on these filters, use the following methods.

```javascript
// Returns the first Object
const firstDog = dogs.first();   

// Returns the last Object
const lastDog = dogs.last();     

// Returns a new collection of objects that return true for the given function
const oldDogsOnly = dogs.where(dog => dog.age > 12);
```

## Manipulating Collections

To manipulate the results, use the following methods.

```javascript
// Loops through each Object and applies the given function
dogs.forEach(dog => console.log(`I am ${dog.name}`));

// Returns an array of whatever the given function returns
const names = dogs.map(dog => dog.name);

// Loops through each Object and asynchronously executes every function one after the other
dogs.each(dog => service.classes.destroy(dog));

// Loops through each Object and asynchronously executes all functions in parallel
dogs.all(dog => service.classes.destroy(dog));

// Iterate through every Object
for(const dog of dogs) {

    console.log(`I am ${dog.name} and my owner is ${dog.owner.name}`);

}
```

## Converting Collections

Oftentimes, you may opt to use native data types to handle Objects. To accomodate this, Collections contain the following methods.

```javascript
// Returns an array of Objects
const dogArray = dogs.toArray();

// Returns an array of object literals
const dogJSON = dogs.toJSON();

// Returns a Map of Objects mapped by `id`
const dogMappedById = dogs.toMap();

// Returns a Map of Objects mapped by `name`
const dogMappedByName = dogs.toMap('name');

// Returns a Map of Objects mapped by `owner.id`
const dogMappedByOwner = dogs.toMap(dog => dog.owner.id);
```

> TIP: Since some methods return new Collections, you can chain several methods together, as needed.

```javascript
// Prepare query
const dogQuery = new Query(Dog);

// Get dogs
const dogs = await service.classes.find(dogQuery);

// Find corgis, and return their names
const firstCorgiNames = dogs.where(dog => dog.breed === 'corgi')
    .map(dog => dog.name);
```

# Triggers

If a `Class` needs to be manipulated before or after it is queried, saved, or destroyed, you can use `Triggers`.

`Triggers` allow you to specify which methods must be executed when certain events occur. You can consider these as hooks to your classes where you can perform additional logic outside of the basic parsing and formatting of `Warp`.

## Before Save

To make sure a method is run before the class is saved (whether created or updated), describe it with `@beforeSave()`.

```javascript
@define class Dog extends Class {

    /** some keys **/

    // You can validate input
    @beforeSave
    validateAge() {
        if(this.age > 30) throw new Error('This dog is too old!');
    }

    // You can change key values
    @beforeSave
    convertWeight() {
        this.weight = this.weight * 2.2;
    }

    // You can set default values
    @beforeSave
    setDefaultDescription() {
        if(this.isNew) { // If you are creating a new Dog
            this.description = 'I am cute dog.';
        }
    }

    // You can update other Objects
    @beforeSave
    async updateOwner(classes) {
        if(this.isNew) {
            const owner = this.owner;
            classes.increment(owner, 'dog_count', 1);
            await classes.save(owner);
        }
    }

    // You can check access
    @beforeSave
    async checkAccess(classes, { user, master }) {
        if(!this.isNew && this.owner.id !== user.id || !master) {
            throw new Error('Only owners of dogs, or administrators can edit their info');
        }
    }

}
```

## After Save

To make sure a method is run after the class is saved (whether created or updated), describe it with `@afterSave()`.

> NOTE: Since these functions are run in the background, errors thrown here will not affect the program. Hence, it is better to catch them and log them.

```javascript
@define class Dog extends Class {

    /** some keys **/

    // Throwing an error will not stop the program
    @afterSave
    uselessError() {
        if(this.age > 30) throw new Error('This will not stop the program');
    }

    // You can save other Objects
    @afterSave
    async addNewPet(classes) {
        if(this.isNew) {
            const pet = new Pet;
            pet.dog = this;
            await classes.save(pet);
        }
    }

    // You can send a notification
    @afterSave
    async sendNotification(classes, { user }) {
        SomeService.Notify('You have successsfully saved a dog!', user.email);
    }

}
```

## Before Destroy

To make sure a method is run before the class is destroyed, describe it with `@beforeDestroy()`.

```javascript
@define class Dog extends Class {

    /** some keys **/

    // You can validate input
    @beforeDestroy
    validateAge() {
        if(this.age < 18) throw new Error('This dog is too young to destroy!');
    }

    // You can change key values
    @beforeDestroy
    changeStatus() {
        this.status = 'removed';
    }

    // You can update other Objects
    @beforeDestroy
    async updateOwner(classes) {
        if(this.isNew) {
            const owner = this.owner;
            classes.increment(owner, 'dog_count', -1);
            await classes.save(owner);
        }
    }

    // You can check access
    @beforeDestroy
    async checkAccess(classes, { user, master }) {
        if(!this.isNew && this.owner.id !== user.id || !master) {
            throw new Error('Only owners of dogs, or administrators can destroy their info');
        }
    }

}
```

## After Destroy

To make sure a method is run after the class is destroyed, describe it with `@afterDestroy()`.

> NOTE: Since these functions are run in the background, errors thrown here will not affect the program. Hence, it is better to catch them and log them.

```javascript
@define class Dog extends Class {

    /** some keys **/

    // You can update other Objects
    @afterDestroy
    async updateOwner(classes) {
        if(this.isNew) {
            const petQuery = new Query(Pet)
                .equalTo('dog.id', this.id);

            const pet = classes.first(petQuery);

            await pet.destroy();
        }
    }

    // You can send a notification
    @afterDestroy
    async sendNotification(classes, { user }) {
        SomeService.Notify('You have successsfully removed a dog!', user.email);
    }

}
```

## Before Find, First, Get

To make sure a method is run before the class is fetched, describe it with `@beforeFind()`, `@beforeFirst`, and `@beforeGet`.

```javascript
@define class Dog extends Class {

    /** some keys **/

    // You can limit the result
    @beforeFind
    limitResult(query) {
        query.limit(5);
    }

    // You can put additional constraints
    @beforeFirst
    removeOldDogs() {
        query.greaterThan('age', 10);
    }

    // You can check access
    @beforeGet
    async checkAccess(query, { user, master }) {
        if(!this.isNew && this.owner.id !== user.id || !master) {
            throw new Error('Only owners of dogs, or administrators can get their info');
        }
    }

}
```

# Functions

Ideally, you can perform a multitude of tasks using classes. However, for special operations that you need to perform inside the server, you can use `Functions`.

A `Function` is a piece of code that can be executed via a named endpoint. It receives input keys that it processes in order to produce a result.

## Defining a Function

To define a Function, use the `Function` class.

```javascript
// Import Function from Warp Server
import { Function } from 'warp-server';
import getDogsPromise from './get-dogs';

class GetFavoriteDogs extends Function {

    // Optional method
    static get masterOnly() {
        return false;
    }

    async run(keys) {
        // collection_id was passed to the request
        const collectionID = keys.collection_id;

        // Do some work here...
        const favoriteDogs = await getDogsPromise(collectionId);

        // Throw an error instead of a result
        throw new Error('Cannot get your favorite dogs');

        // Return the result
        return favoriteDogs;
    }
}
```

For the above example, you can see that we declared a `run()` method to execute our logic. This is the only method you need in order to define a function.

However, you might notice the `masterOnly` getter declared atop. What this does is basically limit access to the function to masters (i.e. requests made using the `X-Warp-Master-Key`). You can omit this code as this defaults to `false`.

## Registering a Function

Right now, the `Function` you created is still not recognized by `Warp`. To register its definition, use `functions.register()`.

```javascript
// Add the GetFavoriteDogs function
service.functions.register({ GetFavoriteDogs });

// Apply the router after
app.use('/api/1', service.router);
```

`functions.register()` accepts a mapping of `Functions`, so you can do the following.

```javascript
// Add multiple functions
service.functions.register({ GetFavoriteDogs, GetGoodDogs });
```