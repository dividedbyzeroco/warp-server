import bcrypt from 'bcryptjs';
import { IAuthAdapter, CredentialsType } from '../../../types/auth';
import User from '../../../classes/user';
import Session from '../../../classes/session';
import ConstraintMap from '../../../utils/constraint-map';
import { InternalKeys } from '../../../utils/constants';

export default class OauthAuthAdapter implements IAuthAdapter {
    /**
     * Private properties
     */
    _user: typeof User;
    _session: typeof Session;
    _salt: string | number;

    /**
     * Constructor
     * @param {User} user
     * @param {Session} session
     * @param {string} salt 
     */
    constructor(user: typeof User, session: typeof Session, salt: string | number) {
        this._user = user;
        this._session = session;
        this._salt = salt;
    }

    async authenticate<T extends User>(credentials: CredentialsType): Promise<T | void> {
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

    async authorize<T extends Session>(sessionToken: string) {
        // Get session class
        const sessionClass = this._session;

        // Prepare current date time
        const now = sessionClass.currentTimestamp;

        // Prepare where clause
        const where = new ConstraintMap();
        where.equalTo(sessionClass.sessionTokenKey, sessionToken);
        where.greaterThanOrEqualTo(sessionClass.revokedAtKey, now);

        // Prepare sorting
        const sort = [`-${InternalKeys.Timestamps.CreatedAt}`];

        // Get matching session
        const matches = await sessionClass.find<T>({ where, sort, skip: 0, limit: 1 });
        const session = matches.first();

        // Return session
        return session;
    }
}