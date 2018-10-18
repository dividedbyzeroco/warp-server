import Class from '../class';
import User from './user';
import Client from './client';
import Key from '../keys/key';
import { InternalKeys } from '../../utils/constants';

export default class Session extends Class {

    static _user: typeof User;
    static _client: typeof Client;

    static get className(): string {
        return InternalKeys.Auth.Session;
    }

    static get user(): typeof User {
        return this._user;
    }

    static get client(): typeof Client {
        return this._client;
    }

    static get userKey(): string {
        return InternalKeys.Auth.User;
    }

    static get clientKey(): string {
        return InternalKeys.Auth.Client;
    }

    static get accessTokenKey(): string {
        return InternalKeys.Auth.AccessToken;
    }

    static get refreshTokenKey(): string {
        return InternalKeys.Auth.RefreshToken;
    }

    static get expiresAtKey(): string {
        return InternalKeys.Auth.ExpiresAt;
    }

    static get revokedAtKey(): string {
        return InternalKeys.Auth.RevokedAt;
    }

    static get scopeKey(): string {
        return InternalKeys.Auth.Scope;
    }

    static get keys(): Array<any> {
        return [
            this.user.as(this.userKey),
            this.client.as(this.clientKey),
            this.accessTokenKey,
            this.refreshTokenKey,
            Key(this.expiresAtKey).asDate(),
            Key(this.revokedAtKey).asDate(),
            Key(this.scopeKey).asJSON()
        ];
    }

    static get currentTimestamp(): string {
        // return this._database.currentTimestamp;
        return '';
    }

    static setUser(user: typeof User) {
        this._user = user;
    }

    static setClient(client: typeof Client) {
        this._client = client;
    }

    set accessToken(value: string) {
        this.set(this.statics<typeof Session>().accessTokenKey, value);
    }

    set refreshToken(value: string) {
        this.set(this.statics<typeof Session>().refreshTokenKey, value);
    }
    
    get client(): number {
        return this.get(this.statics<typeof Session>().clientKey);
    }

    get accessToken(): string {
        return this.get(this.statics<typeof Session>().accessTokenKey);
    }

    get refreshToken(): string {
        return this.get(this.statics<typeof Session>().refreshTokenKey);
    }

    get expiresAt(): string {
        return this.get(this.statics<typeof Session>().expiresAtKey);
    }

    get revokedAt(): string {
        return this.get(this.statics<typeof Session>().revokedAtKey);
    }
}