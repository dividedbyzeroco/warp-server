import Class from './class';
import User from './user';
export default class Session extends Class {
    static _user: typeof User;
    static readonly className: string;
    static readonly user: typeof User;
    static readonly userKey: string;
    static readonly originKey: string;
    static readonly sessionTokenKey: string;
    static readonly revokedAtKey: string;
    static readonly keys: Array<any>;
    static readonly currentTimestamp: string;
    static setUser(user: typeof User): void;
    static getFromToken(sessionToken: string): Promise<Session | void>;
    static verify(sessionToken: string): Promise<User | undefined>;
    origin: string;
    sessionToken: string;
    revokedAt: string;
}
