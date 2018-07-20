import { IAuthAdapter, CredentialsType } from '../../../types/auth';
import User from '../../../classes/user';
import Session from '../../../classes/session';
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
    constructor(user: typeof User, session: typeof Session, salt: string | number);
    authenticate<T extends User>(credentials: CredentialsType): Promise<T | void>;
    authorize<T extends Session>(sessionToken: string): Promise<void | T>;
}
