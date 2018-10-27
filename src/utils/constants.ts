export const InternalId = 'id';

export const InternalKeys = Object.freeze({
    Id: InternalId,
    Timestamps: Object.freeze({
        CreatedAt: 'created_at',
        UpdatedAt: 'updated_at',
        DeletedAt: 'deleted_at'
    }),
    Middleware: Object.freeze({
        ApiKey: 'X-Warp-API-Key',
        MasterKey: 'X-Warp-Master-Key',
        User: 'user',
        Result: 'result',
        DataMapper: 'classes'
    }),
    Pointers: Object.freeze({
        Type: 'type',
        ClassName: 'class_name',
        Attributes: 'attributes'
    }),
    Auth: Object.freeze({
        User: 'user',
        Username: 'username',
        Email: 'email',
        Password: 'password'
    })
});

export const DatabaseWrite = 'write';
export const DatabaseRead = 'read';

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