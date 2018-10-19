import User from '../classes/auth/user';
import Session from '../classes/auth/session';
import Client from '../classes/auth/client';

export type AuthFunctionsType = {
    use: (user: typeof User, session: typeof Session, client: typeof Client) => void;
    user: () => typeof User;
    session: () => typeof Session;
    client: () => typeof Client;
};

export type AuthOptionsType = {
    accessToken?: string,
    username?: string,
    email?: string,
    password?: string
};

export type CredentialsType = {
    username?: string,
    email?: string,
    password: string
};