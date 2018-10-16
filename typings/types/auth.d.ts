import User from '../classes/user';
import Session from '../classes/session';
import Client from '../classes/client';
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
