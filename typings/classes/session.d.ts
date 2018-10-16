import Class from './class';
import User from './user';
import Client from './client';
export default class Session extends Class {
    static _user: typeof User;
    static _client: typeof Client;
    static readonly className: string;
    static readonly user: typeof User;
    static readonly client: typeof Client;
    static readonly userKey: string;
    static readonly clientKey: string;
    static readonly accessTokenKey: string;
    static readonly refreshTokenKey: string;
    static readonly expiresAtKey: string;
    static readonly revokedAtKey: string;
    static readonly scopeKey: string;
    static readonly keys: Array<any>;
    static readonly currentTimestamp: string;
    static setUser(user: typeof User): void;
    static setClient(client: typeof Client): void;
    accessToken: string;
    refreshToken: string;
    readonly client: number;
    readonly expiresAt: string;
    readonly revokedAt: string;
}
