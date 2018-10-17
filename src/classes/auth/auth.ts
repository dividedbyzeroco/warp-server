import bcrypt from 'bcryptjs';
import rtg from 'random-token-generator';
import uniqid from 'uniqid';
import { CredentialsType } from '../../types/auth';
import User from './user';
import Session from './session';
import Client from './client';
import ConstraintMap from '../../utils/constraint-map';
import { InternalKeys } from '../../utils/constants';
import { addToDate } from '../../utils/format';

export default class Auth {
    /**
     * Private properties
     */
    _user: typeof User;
    _session: typeof Session;
    _client: typeof Client;
    _salt: number = 8;
    _expiry: string = '30 minutes';
    _revocation: string = '1 year';

    constructor(user: typeof User, session: typeof Session, client: typeof Client) {
        this._user= user;
        this._session = session;
        this._client = client
    }

    get user(): typeof User {
        return this._user;
    }

    get session(): typeof Session {
        return this._session;
    }

    get client(): typeof Client {
        return this._client;
    }

    set salt(value: number) {
        this._salt = value;
    }

    set expiry(value: string) {
        this._expiry = value;
    }

    set revocation(value: string) {
        this._revocation = value;
    }

    generateSecret() {
        return uniqid();
    }

    async register<T extends User>(credentials: CredentialsType): Promise<T> {
        // Get credentials
        const { username, email, password } = credentials;

        // Get user class
        const userClass = this._user;

        // Create a new user
        const user = new userClass({});
        user.username = username || '';
        user.email = email || '';
        user.password = await bcrypt.hash(password, this._salt);

        // Save the user
        await user.save();

        // Return instance
        return user as T;
    }

    async login<T extends User>(credentials: CredentialsType): Promise<T | void> {
        // Get parameters
        const { username, email, password } = credentials;

        // Get user class
        const userClass = this._user;

        // Prepare where clause
        const where = new ConstraintMap();
        
        // Determine whether to search by username or by email
        if(typeof username !== 'undefined') where.equalTo(userClass.usernameKey, username);
        else where.equalTo(userClass.emailKey, email);

        // Get matching user
        const result = await userClass.find<T>({ where, skip: 0, limit: 1 });
        const user = result.first();

        // If user is not found, return undefined
        if(typeof user === 'undefined') return;

        // Return user if the password is valid, else return undefined
        if(await bcrypt.compare(password, user.password)) return user;
        else return;
    }


    async saveClient<T extends Client>(name: string, description: string, scope: Array<string>): Promise<T> {
        // Get client class
        const clientClass = this._client;
        const secret = this.generateSecret();

        // Create a new client
        const client = new clientClass({});
        client.secret = secret;
        client.name = name;
        client.description = description;
        client.set(clientClass.scopeKey, scope);
        
        // Save the client
        await client.save();

        // Return instance
        return client as T;
    }

    async getClient<T extends Client>(identifier: string): Promise<T | void> {
        // Get client class
        const clientClass = this._client;

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(clientClass.identifierKey, identifier);

        // Get matching client
        const result = await clientClass.find<T>({ where, skip: 0, limit: 1 });
        const client  = result.first();

        // If user is not found, return undefined
        if(typeof client === 'undefined') return;

        // Return client
        return client;
    }

    async saveSession(user: User, client: Client) {
        // Get session class
        const sessionClass = this._session;

        // Prepare current date time
        const now = sessionClass.currentTimestamp;

        // Prepare session
        const session = new sessionClass({});
        session.accessToken = await rtg.generateKey({
            len: 28,
            string: true,
            strong: true,
            retry: false
        });
        session.refreshToken = await rtg.generateKey({
            len: 28,
            string: true,
            strong: true,
            retry: false
        });
        session.set(sessionClass.userKey, user);
        session.set(sessionClass.clientKey, client);
        session.set(sessionClass.expiresAtKey, addToDate(now, this._expiry).toISOString());
        session.set(sessionClass.revokedAtKey, addToDate(now, this._revocation).toISOString());

        // Save session
        await session.save();
    }

    async getSession<T extends Session>(accessToken: string) {
        // Get session class
        const sessionClass = this._session;

        // Prepare current date time
        const now = sessionClass.currentTimestamp;

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(sessionClass.accessTokenKey, accessToken);
        where.greaterThanOrEqualTo(sessionClass.expiresAtKey, now);
        where.greaterThanOrEqualTo(sessionClass.revokedAtKey, now);

        // Prepare sorting
        const sort = [`-${InternalKeys.Timestamps.CreatedAt}`];

        // Get matching session
        const matches = await sessionClass.find<T>({ where, sort, skip: 0, limit: 1 });
        const session = matches.first();

        // Return session
        return session;
    }

    async refreshSession<T extends Session>(refreshToken: string) {
        // Get session class
        const sessionClass = this._session;

        // Prepare current date time
        const now = sessionClass.currentTimestamp;

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(sessionClass.refreshTokenKey, refreshToken);
        where.greaterThanOrEqualTo(sessionClass.revokedAtKey, now);

        // Prepare sorting
        const sort = [`-${InternalKeys.Timestamps.CreatedAt}`];

        // Get matching session
        const matches = await sessionClass.find<T>({ where, sort, skip: 0, limit: 1 });
        const session = matches.first();

        // Check if session exists
        if(typeof session === 'undefined') throw new Error('Session not found');

        // Update access token and expiry
        session.accessToken = await rtg.generateKey({
            len: 28,
            string: true,
            strong: true,
            retry: false
        });
        session.set(sessionClass.expiresAtKey, addToDate(now, this._expiry).toISOString());

        // Save session
        await session.save();

        // Return access token
        return session.accessToken;
    }

    async revokeSession<T extends Session>(refreshToken: string) {
        // Get session class
        const sessionClass = this._session;

        // Prepare current date time
        const now = new Date(sessionClass.currentTimestamp);

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(sessionClass.refreshTokenKey, refreshToken);
        where.greaterThanOrEqualTo(sessionClass.revokedAtKey, now);

        // Prepare sorting
        const sort = [`-${InternalKeys.Timestamps.CreatedAt}`];

        // Get matching session
        const matches = await sessionClass.find<T>({ where, sort, skip: 0, limit: 1 });
        const session = matches.first();
        
        // Check if session exists
        if(typeof session === 'undefined') throw new Error('Session not found');

        // Update expiry and revocation
        session.set(sessionClass.expiresAtKey, now.toISOString());
        session.set(sessionClass.revokedAtKey, now.toISOString());

        // Save session
        await session.save();
    }

    async getUser<T extends User>(accessToken: string) {
        // Get user class
        const userClass = this._user;

        // Get session
        const session = await this.getSession(accessToken);

        // Check if session exists
        if(!session) return;

        // Get user details
        const user = await userClass.getById<T>({ id: session['user'].id });

        return user;
    }
}