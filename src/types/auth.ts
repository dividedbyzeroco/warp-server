import User from '../classes/user';
import Session from '../classes/session';
import Client from '../classes/client';

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