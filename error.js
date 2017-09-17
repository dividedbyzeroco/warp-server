// References
var _ = require('underscore');

// Class constructor
var WarpError = function(code, message) {
    this.status = code == 102 || code == 103 ? 401 : 501;
    this.code = code;
    this.name = 'WarpError';
    this.message = message || 'An unexpected error occurred.';
    this.stack = (new Error()).stack;
};
WarpError.prototype = _.create(Error.prototype);
WarpError.prototype.constructor = WarpError;

WarpError.Code = {
    MissingConfiguration: 300,
    InternalServerError: 100,
    QueryError: 101, // Error with a database query
    InvalidCredentials: 102, // Invalid username/password
    InvalidSessionToken: 103, // Invalid session token
    InvalidObjectKey: 104, // Key validation failed
    InvalidPointer: 105, // Invalid pointer
    ForbiddenOperation: 106, // Incorrect use of API
    UsernameTaken: 107, // Username registered already exists
    EmailTaken: 108, // Email registered already exists
    InvalidAPIKey: 109, // Invalid API Key
    ModelNotFound: 110,
    FunctionNotFound: 111,
    QueueNotFound: 112,
    TooManyRequest: 429
};

module.exports = WarpError;