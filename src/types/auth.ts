// @flow
/**
 * References
 */
import { UserClass } from '../classes/user';
import { SessionClass } from '../classes/session';

export type AuthMapType = {
    user: typeof UserClass,
    session: typeof SessionClass
};

export type AuthFunctionsType = {
    set: (user: typeof UserClass, session: typeof SessionClass) => void;
    user: () => typeof UserClass;
    session: () => typeof SessionClass;
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