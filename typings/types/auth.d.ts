import User from '../classes/auth/user';
import Session from '../classes/auth/session';
import Client from '../classes/auth/client';
export declare type AuthFunctionsType = {
    use: (user: typeof User, session: typeof Session, client: typeof Client) => void;
    user: () => typeof User;
    session: () => typeof Session;
    client: () => typeof Client;
};
export declare type AuthOptionsType = {
    accessToken?: string;
    username?: string;
    email?: string;
    password?: string;
};
export declare type CredentialsType = {
    username?: string;
    email?: string;
    password: string;
};
