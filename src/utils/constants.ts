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
        Secret: 'secret',
        Name: 'name',
        Description: 'description',
        Type: 'type',
        Status: 'status',
        Scope: 'scope'
    }),
    Access: Object.freeze({
        Find: 'find',
        Get: 'get',
        Create: 'create',
        Update: 'update',
        Destroy: 'destroy',
        Run: 'run',
        Manage: 'manage'
    }),
    Pointers: Object.freeze({
        LegacyClassName: 'className',
        ClassName: 'class_name',
        Attributes: 'attributes'
    })
});

export const Defaults = Object.freeze({
    Query: Object.freeze({
        Sort: [InternalKeys.Id],
        Skip: 0,
        Limit: 100
    })
});