// @flow
/**
 * References
 */
import Model from './model';
import User from './user';
import { KeyManager } from './key';
import { InternalKeys } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';

class SessionClass extends Model.Class {

    static _user: typeof User.Class;

    static get className(): string {
        return InternalKeys.Auth.Session;
    }

    static get user(): typeof User.Class {
        return this._user;
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

    static get keys(): Array<string | Model.Pointer | KeyManager> {
        return [this.user.as(this.userKey), this.originKey, this.sessionTokenKey, this.revokedAtKey];
    }

    static setUser(user: typeof User.Class) {
        this._user = user;
    }

    static async getFromToken(sessionToken: string): Promise<Session.Class | void> { 
        // Prepare current date time
        const now = this._database.currentTimestamp;

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(this.sessionTokenKey, sessionToken);
        where.greaterThanOrEqualTo(this.revokedAtKey, now);

        // Prepare sorting
        const sort = [`-${InternalKeys.Timestamps.CreatedAt}`];

        // Get matching session
        const session = (await this.find({ where, sort, skip: 0, limit: 1 })).first();

        // Return session
        return session;
    }

    static async verify(sessionToken: string): Promise<User.Class | void> {
        // $FlowFixMe
        const session = await this.getFromToken(sessionToken);

        // Check if session exists
        if(!session) return;

        // Get user details
        const user = await this.user.getById({ id: session.user.id });

        return user;
    }

    set origin(value: string) {
        this.set(this.constructor.originKey, value);
    }

    set sessionToken(value: string) {
        this.set(this.constructor.sessionTokenKey, value);
    }

    set revokedAt(value: string) {
        this.set(this.constructor.revokedAtKey, value);
    }

    get origin(): string {
        return this.get(this.constructor.originKey);
    }

    get sessionToken(): string {
        return this.get(this.constructor.sessionTokenKey);
    }

    get revokedAt(): string {
        return this.get(this.constructor.revokedAtKey);
    }
}

export default class Session extends Model {
    
    static get Class(): typeof SessionClass {
        return SessionClass;
    }

}