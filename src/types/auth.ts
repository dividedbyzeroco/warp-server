import User from '../classes/user';
import Session from '../classes/session';

export type AuthMapType = {
    user: typeof User,
    session: typeof Session
};

export type AuthFunctionsType = {
    exists: () => boolean;
    set: (user: typeof User, session: typeof Session) => void;
    user: () => typeof User;
    session: () => typeof Session;
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