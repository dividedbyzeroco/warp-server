import Model, { Pointer } from './model';
import { UserClass } from './user';
import Key, { KeyManager } from './key';
import { InternalKeys } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';

export class SessionClass extends Model.Class {

    static _user: typeof UserClass;

    static get className(): string {
        return InternalKeys.Auth.Session;
    }

    static get user(): typeof UserClass {
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

    static get keys(): Array<string | Pointer | KeyManager> {
        return [this.user.as(this.userKey), this.originKey, this.sessionTokenKey, Key(this.revokedAtKey).asDate()];
    }

    static setUser(user: typeof UserClass) {
        this._user = user;
    }

    static async getFromToken(sessionToken: string): Promise<SessionClass | void> { 
        // Prepare current date time
        const now = this._database.currentTimestamp;

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(this.sessionTokenKey, sessionToken);
        where.greaterThanOrEqualTo(this.revokedAtKey, now);

        // Prepare sorting
        const sort = [`-${InternalKeys.Timestamps.CreatedAt}`];

        // Get matching session
        const matches = await this.find<SessionClass>({ where, sort, skip: 0, limit: 1 });
        const session = matches.first();

        // Return session
        return session;
    }

    static async verify(sessionToken: string): Promise<UserClass | void> {
        // $FlowFixMe
        const session = await this.getFromToken(sessionToken);

        // Check if session exists
        if(!session) return;

        // Get user details
        const user = await this.user.getById({ id: session['user'].id }) as UserClass;

        return user;
    }

    set origin(value: string) {
        this.set(this.statics<typeof SessionClass>().originKey, value);
    }

    set sessionToken(value: string) {
        this.set(this.statics<typeof SessionClass>().sessionTokenKey, value);
    }

    set revokedAt(value: string) {
        this.set(this.statics<typeof SessionClass>().revokedAtKey, value);
    }

    get origin(): string {
        return this.get(this.statics<typeof SessionClass>().originKey);
    }

    get sessionToken(): string {
        return this.get(this.statics<typeof SessionClass>().sessionTokenKey);
    }

    get revokedAt(): string {
        return this.get(this.statics<typeof SessionClass>().revokedAtKey);
    }
}

export default class Session extends Model {
    
    static get Class(): typeof SessionClass {
        return SessionClass;
    }

}