export default class WarpError extends Error {
    /**
     * Public properties
     */
    name: string;
    code: number;
    static readonly Code: Readonly<{
        MissingConfiguration: number;
        InternalServerError: number;
        QueryError: number;
        InvalidCredentials: number;
        InvalidSessionToken: number;
        InvalidObjectKey: number;
        InvalidPointer: number;
        ForbiddenOperation: number;
        UsernameTaken: number;
        EmailTaken: number;
        InvalidAPIKey: number;
        ClassNotFound: number;
        FunctionNotFound: number;
        RequestTimeout: number;
        FunctionError: number;
        TooManyRequests: number;
        DatabaseError: number;
    }>;
    static readonly Status: Readonly<{
        ServerError: number;
        Unauthorized: number;
        Forbidden: number;
        NotFound: number;
        RequestTimeout: number;
        TooManyRequests: number;
    }>;
    statics<T extends typeof WarpError>(): T;
    readonly status: number;
    constructor(code: number, message: string);
}
