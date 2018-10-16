export declare const InternalKeys: Readonly<{
    Id: string;
    Timestamps: Readonly<{
        CreatedAt: string;
        UpdatedAt: string;
        DeletedAt: string;
    }>;
    Auth: Readonly<{
        User: string;
        Username: string;
        Email: string;
        Password: string;
        Role: string;
        Session: string;
        Bearer: string;
        AccessToken: string;
        RefreshToken: string;
        ExpiresAt: string;
        RevokedAt: string;
        Client: string;
        Identifier: string;
        Secret: string;
        Name: string;
        Description: string;
        Type: string;
        Status: string;
        Scope: string;
    }>;
    Pointers: Readonly<{
        LegacyClassName: string;
        ClassName: string;
        Attributes: string;
    }>;
    ClientStatus: {
        Active: string;
        Inactive: string;
    };
}>;
export declare const Defaults: Readonly<{
    Query: Readonly<{
        Sort: string[];
        Skip: number;
        Limit: number;
    }>;
}>;
export declare const AccessFind = "find";
export declare const AccessGet = "get";
export declare const AccessCreate = "create";
export declare const AccessUpdate = "update";
export declare const AccessDestroy = "destroy";
export declare const AccessRun = "run";
