References
==========

## WarpServer.Model.Validation

- FixedString(int: min, int: max) - checks whether a given string value has at least `min` characters and has, at most, `max` characters
- Password(int: min, int: max) - same as FixedString but automatically appends the Password parser to the model, if added
- Email - validates if a given string has the right email format
- Integer - validates if a given value is an integer
- PositiveInteger - validates if a given value is a counting number
- Float - validates if a given value is a float value
- Pointer - validates if a given value is a pointer; automatically appends the Pointer parser and Pointer formatter, if added

## WarpServer.Model.Parser

- NoSpaces - removes spaces from the entire string
- Password - hashes a given string using bcrypt
- Integer - parses a given value to an integer
- Float(int: decimals) - parses a given value to a float value with a specified number of decimals
- Date - parses a given string as a database-friendly datetime value
- Pointer - parses a given pointer as a database-friendly value

## WarpServer.Model.Formatter

- Integer - formats a given value to an integer
- Float(int: decimals) - formats a given value to a float value with a specified number of decimals
- Date - formats a retrieved value as an ISO 8061 date string (UTC)
- Pointer - formats a retrieved value as a pointer

## WarpServer.Model.PreSave

- Session - automatically generates a random session_token for a session object and sets the deleted_at key relative to the set expiry date (default: 30 days)

## WarpServer.Error Codes

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

## WarpServer.Migration Data Types

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

## WarpServer.Migration Details

- primary: set the field as a PRIMARY KEY
- increment: set the field as AUTO_INCREMENT
- unique: set the field as UNIQUE
- required: set the field as NOT NULL

## WarpServer.Migration Actions

- add: add a new field to a schema
- modify: modify an existing field's data type
- rename: rename an existing field's name and data type (both are required)
- drop: drop an existing field