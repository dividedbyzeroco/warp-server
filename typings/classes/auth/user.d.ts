import Class from '../class';
export default class User extends Class {
    static readonly className: string;
    static readonly usernameKey: string;
    static readonly emailKey: string;
    static readonly passwordKey: string;
    static readonly roleKey: string;
    static readonly keys: Array<any>;
    static readonly hidden: Array<string>;
    username: string;
    email: string;
    password: string;
    role: string;
    beforeSave(): Promise<void>;
}
