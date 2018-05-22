import User from '../classes/user';
import Session from '../classes/session';
export declare type AuthMapType = {
    user: typeof User;
    session: typeof Session;
};
export declare type AuthFunctionsType = {
    exists: () => boolean;
    set: (user: typeof User, session: typeof Session) => void;
    user: () => typeof User;
    session: () => typeof Session;
};
export declare type AuthOptionsType = {
    sessionToken?: string;
    username?: string;
    email?: string;
    password?: string;
};
export declare type CredentialsType = {
    username?: string;
    email?: string;
    password: string;
};
