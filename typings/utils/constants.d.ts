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
        Session: string;
        Origin: string;
        SessionToken: string;
        RevokedAt: string;
    }>;
    Pointers: Readonly<{
        LegacyClassName: string;
        ClassName: string;
        Attributes: string;
    }>;
}>;
export declare const Defaults: Readonly<{
    Query: Readonly<{
        Sort: string[];
        Skip: number;
        Limit: number;
    }>;
}>;
