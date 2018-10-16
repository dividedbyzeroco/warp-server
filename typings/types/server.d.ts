export declare type ServerConfigType = {
    apiKey: string;
    masterKey: string;
    accessExpiry?: string;
    sessionRevocation?: string;
    passwordSalt?: number;
    databaseURI?: string;
    keepConnections?: boolean;
    charset?: string;
    timeout?: number;
    requestLimit?: number;
    customResponse?: boolean;
    supportLegacy?: boolean;
};
