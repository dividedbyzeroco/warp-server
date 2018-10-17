import { CredentialsType } from '../types/auth';
import User from './user';
import Session from './session';
import Client from './client';
export default class Auth {
    /**
     * Private properties
     */
    _user: typeof User;
    _session: typeof Session;
    _client: typeof Client;
    _salt: number;
    _expiry: string;
    _revocation: string;
    constructor(user: typeof User, session: typeof Session, client: typeof Client);
    readonly user: typeof User;
    readonly session: typeof Session;
    readonly client: typeof Client;
    salt: number;
    expiry: string;
    revocation: string;
    generateSecret(): any;
    register<T extends User>(credentials: CredentialsType): Promise<T>;
    login<T extends User>(credentials: CredentialsType): Promise<T | void>;
    saveClient<T extends Client>(name: string, description: string, scope: Array<string>): Promise<T>;
    getClient<T extends Client>(identifier: string): Promise<T | void>;
    saveSession(user: User, client: Client): Promise<void>;
    getSession<T extends Session>(accessToken: string): Promise<any>;
    refreshSession<T extends Session>(refreshToken: string): Promise<any>;
    revokeSession<T extends Session>(refreshToken: string): Promise<void>;
    getUser<T extends User>(accessToken: string): Promise<any>;
}
