export const InternalKeys = Object.freeze({
    Id: 'id',
    Timestamps: Object.freeze({
        CreatedAt: 'created_at',
        UpdatedAt: 'updated_at',
        DeletedAt: 'deleted_at'
    }),
    Auth: Object.freeze({
        User: 'user',
        Username: 'username',
        Email: 'email',
        Password: 'password',
        Role: 'role',
        Session: 'session',
        Bearer: 'bearer',
        AccessToken: 'access_token',
        RefreshToken: 'refresh_token',
        ExpiresAt: 'expires_at',
        RevokedAt: 'revoked_at',
        Client: 'client',
        Identifier: 'identifier',
        Secret: 'secret',
        Name: 'name',
        Description: 'description',
        Type: 'type',
        Status: 'status',
        Scope: 'scope'
    }),
    Pointers: Object.freeze({
        LegacyClassName: 'className',
        ClassName: 'class_name',
        Attributes: 'attributes'
    }),
    ClientStatus: {
        Active: 'active',
        Inactive: 'inactive'
    },
    Middleware: {
        AccessToken: 'accessToken',
        User: 'user',
        Result: 'result'
    }
});

export const Defaults = Object.freeze({
    Query: Object.freeze({
        Sort: [InternalKeys.Id],
        Skip: 0,
        Limit: 100
    })
});

export const AccessFind = 'find';
export const AccessGet = 'get';
export const AccessCreate = 'create';
export const AccessUpdate = 'update';
export const AccessDestroy = 'destroy';
export const AccessRun = 'run';