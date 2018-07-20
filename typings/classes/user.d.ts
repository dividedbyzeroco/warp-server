import Class from './class';
import { ICryptoAdapter } from '../types/crypto';
import { CredentialsType } from '../types/auth';
export default class User extends Class {
    static _crypto: ICryptoAdapter;
    static readonly className: string;
    static readonly usernameKey: string;
    static readonly emailKey: string;
    static readonly passwordKey: string;
    static readonly keys: Array<any>;
    static readonly hidden: Array<string>;
    static setCrypto(crypto: ICryptoAdapter): void;
    static verify<T extends User>({ username, email, password }: CredentialsType): Promise<T | undefined>;
    username: string;
    email: string;
    password: string;
    beforeSave(): Promise<void>;
}
