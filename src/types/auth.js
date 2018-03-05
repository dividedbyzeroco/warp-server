// @flow
/**
 * References
 */
import User from '../classes/user';
import Session from '../classes/session';

export type AuthMapType = {
    user: typeof User.Class,
    session: typeof Session.Class
};

export type AuthFunctionsType = {
    set: (user: typeof User.Class, session: typeof Session.Class) => void;
    user: () => typeof User.Class;
    session: () => typeof Session.Class;
};

export type AuthOptionsType = {
    sessionToken?: string,
    username?: string,
    email?: string,
    password?: string
};

export type CredentialsType = {
    username?: string,
    email?: string,
    password: string
};