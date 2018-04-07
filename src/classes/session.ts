import Class, { Pointer } from './class';
import User from './user';
import Key, { KeyManager } from './key';
import { InternalKeys } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';

export default class Session extends Class {

    static _user: typeof User;

    static get className(): string {
        return InternalKeys.Auth.Session;
    }

    static get user(): typeof User {
        return Session._user;
    }

    static get userKey(): string {
        return InternalKeys.Auth.User;
    }

    static get originKey(): string {
        return InternalKeys.Auth.Origin;
    }

    static get sessionTokenKey(): string {
        return InternalKeys.Auth.SessionToken;
    }

    static get revokedAtKey(): string {
        return InternalKeys.Auth.RevokedAt;
    }

    static get keys(): Array<any> {
        return [Session.user.as(Session.userKey), Session.originKey, Session.sessionTokenKey, Key(Session.revokedAtKey).asDate()];
    }

    static setUser(user: typeof User) {
        Session._user = user;
    }

    static async getFromToken(sessionToken: string): Promise<Session | void> { 
        // Prepare current date time
        const now = Session._database.currentTimestamp;

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(Session.sessionTokenKey, sessionToken);
        where.greaterThanOrEqualTo(Session.revokedAtKey, now);

        // Prepare sorting
        const sort = [`-${InternalKeys.Timestamps.CreatedAt}`];

        // Get matching session
        const matches = await Session.find<Session>({ where, sort, skip: 0, limit: 1 });
        const session = matches.first();

        // Return session
        return session;
    }

    static async verify(sessionToken: string): Promise<User | undefined> {
        // $FlowFixMe
        const session = await Session.getFromToken(sessionToken);

        // Check if session exists
        if(!session) return;

        // Get user details
        const user = await Session.user.getById({ id: session['user'].id }) as User;

        return user;
    }

    set origin(value: string) {
        this.set(this.statics<typeof Session>().originKey, value);
    }

    set sessionToken(value: string) {
        this.set(this.statics<typeof Session>().sessionTokenKey, value);
    }

    set revokedAt(value: string) {
        this.set(this.statics<typeof Session>().revokedAtKey, value);
    }

    get origin(): string {
        return this.get(this.statics<typeof Session>().originKey);
    }

    get sessionToken(): string {
        return this.get(this.statics<typeof Session>().sessionTokenKey);
    }

    get revokedAt(): string {
        return this.get(this.statics<typeof Session>().revokedAtKey);
    }
}