// @flow
export default class WarpError extends Error {

    /**
     * Public properties
     */
    name: string = 'Warp Server Error';
    code: number;

    static get Code(): Object {
        return Object.freeze({
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
            FunctionError: 113,
            TooManyRequests: 114,
            DatabaseError: 115
        });
    }

    static get Status(): Object {
        return Object.freeze({
            Unauthorized: 401,
            ServerError: 500
        });
    }

    get status(): string {
        if(this.code == this.constructor.Code.InvalidCredentials || 
            this.code == this.constructor.Code.InvalidSessionToken) {
            return this.constructor.Status.Unauthorized;
        }
        else { 
            return this.constructor.Status.ServerError;
        }
    }

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}