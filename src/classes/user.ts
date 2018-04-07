import enforce from 'enforce-js';
import Class, { Pointer } from './class';
import { KeyManager } from './key';
import Error from '../utils/error';
import ConstraintMap from '../utils/constraint-map';
import { InternalKeys } from '../utils/constants';
import { ICryptoAdapter } from '../types/crypto';
import { CredentialsType } from '../types/auth';

export default class User extends Class {

    static _crypto: ICryptoAdapter;

    static get className(): string {
        return InternalKeys.Auth.User;
    }
    
    static get usernameKey(): string {
        return InternalKeys.Auth.Username;
    }
    
    static get emailKey(): string {
        return InternalKeys.Auth.Email;
    }

    static get passwordKey(): string {
        return InternalKeys.Auth.Password;
    }

    static get keys(): Array<any> {
        return [User.usernameKey, User.emailKey, User.passwordKey];
    }

    static get hidden(): Array<string> {
        return [User.passwordKey];
    }

    static setCrypto(crypto: ICryptoAdapter) {
        User._crypto = crypto;
    }

    static async verify<T extends User>({ username, email, password }: CredentialsType): Promise<T | undefined> {
        // Prepare where clause
        const where = new ConstraintMap();
        
        // Determine whether to search by username or by email
        if(typeof username !== 'undefined') where.equalTo(User.usernameKey, username);
        else where.equalTo(User.emailKey, email);

        // Get matching user
        const result = await User.find<T>({ where, skip: 0, limit: 1 });
        const user = result.first();

        // If user is not found, return undefined
        if(typeof user === 'undefined') return;

        // Return user if the password is valid, else return undefined
        if(User._crypto.validate(password, user.password)) return user;
        else return;
    }

    set username(value: string) {
        this.set(this.statics<typeof User>().usernameKey, value);
    }

    set email(value: string) {
        enforce`${{ email: value }} as a string, and a valid email address`;
        this.set(this.statics<typeof User>().emailKey, value);
    }

    set password(value: string) {
        this.set(this.statics<typeof User>().passwordKey, this.statics<typeof User>()._crypto.hash(value));
    }

    get username(): string {
        return this.get(this.statics<typeof User>().usernameKey);
    }

    get email(): string {
        return this.get(this.statics<typeof User>().emailKey);
    }

    get password(): string {
        return this._keyMap.get(this.statics<typeof User>().passwordKey);
    }

    async beforeSave() {
        // Check if username, email and password is provided
        if(this.isNew) {
            // Get username and email
            const username = this.username;
            const email = this.email;
            const password = this.password;
            
            enforce`${{username}} as a string`;
            enforce`${{email}} as a string, and a valid email address`;
            enforce`${{password}} as a string`;
            
            // Prepare filters
            const usernameWhere = new ConstraintMap();
            usernameWhere.equalTo(this.statics<typeof User>().usernameKey, username);
            const emailWhere = new ConstraintMap();
            emailWhere.equalTo(this.statics<typeof User>().emailKey, email);
            
            // Search for existing username
            const usernameMatch = (await this.statics<typeof User>().find({ where: usernameWhere, skip: 0, limit: 1 })).first();
            if(typeof usernameMatch !== 'undefined') throw new Error(Error.Code.UsernameTaken, 'Username already taken');
            
            // Search for existing email
            const emailMatch = (await this.statics<typeof User>().find({ where: emailWhere, skip: 0, limit: 1 })).first();
            if(typeof emailMatch !== 'undefined') throw new Error(Error.Code.EmailTaken, 'Email already taken');
        }

        return;
    }
}