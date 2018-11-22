export default class WarpError extends Error {

    /**
     * Public properties
     */
    public name: string = 'Warp Server Error';
    public code: number;

    static get Code() {
        return Object.freeze({
            MissingConfiguration: 300,
            InternalServerError: 100,
            QueryError: 101, // Error with a database query
            InvalidCredentials: 102, // Invalid username/password
            InvalidSessionToken: 103, // Invalid session token
            InvalidObjectKey: 104, // Key validation failed
            InvalidRelation: 105, // Invalid relation
            ForbiddenOperation: 106, // Incorrect use of API
            UsernameTaken: 107, // Username registered already exists
            EmailTaken: 108, // Email registered already exists
            InvalidAPIKey: 109, // Invalid API Key
            ClassNotFound: 110,
            FunctionNotFound: 111,
            RequestTimeout: 112,
            FunctionError: 113,
            TooManyRequests: 114,
            DatabaseError: 115,
        });
    }

    static get Status() {
        return Object.freeze({
            ServerError: 400,
            Unauthorized: 401,
            Forbidden: 403,
            NotFound: 404,
            RequestTimeout: 408,
            TooManyRequests: 429,
        });
    }

    public statics<T extends typeof WarpError>(): T {
        return this.constructor as T;
    }

    get status(): number {
        if (this.code === this.statics().Code.InvalidCredentials
            || this.code === this.statics().Code.InvalidSessionToken
            || this.code === this.statics().Code.UsernameTaken
            || this.code === this.statics().Code.EmailTaken) {
            return this.statics().Status.Unauthorized;
        } else if (this.code === this.statics().Code.ForbiddenOperation) {
            return this.statics().Status.Forbidden;
        } else if (this.code === this.statics().Code.ClassNotFound
            || this.code === this.statics().Code.FunctionNotFound) {
                return this.statics().Status.NotFound;
        } else if (this.code === this.statics().Code.RequestTimeout) {
            return this.statics().Status.RequestTimeout;
        } else if (this.code === this.statics().Code.TooManyRequests) {
            return this.statics().Status.TooManyRequests;
        } else {
            return this.statics().Status.ServerError;
        }
    }

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}