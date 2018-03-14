// @flow
/**
 * References
 */
import enforce from 'enforce-js';
import Model from './model';
import { KeyManager } from './key';
import { InternalKeys } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import Error from '../utils/error';
import type { ICryptoAdapter } from '../types/crypto';
import type { CredentialsType } from '../types/auth';

class UserClass extends Model.Class {

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

    static get keys(): Array<string | Model.Pointer | KeyManager> {
        return [this.usernameKey, this.emailKey, this.passwordKey];
    }

    static get hidden(): Array<string> {
        return [this.passwordKey];
    }

    static setCrypto(crypto: ICryptoAdapter) {
        this._crypto = crypto;
    }

    static async verify({ username, email, password }: CredentialsType): Promise<this | void> {
        // Prepare where clause
        const where = new ConstraintMap();
        
        // Determine whether to search by username or by email
        if(typeof username !== 'undefined') where.equalTo(this.usernameKey, username);
        else where.equalTo(this.emailKey, email);

        // Get matching user
        const user = (await this.find({ where, skip: 0, limit: 1 })).first();

        // If user is not found, return undefined
        if(typeof user === 'undefined') return;

        // Return user if the password is valid, else return undefined
        if(this._crypto.validate(password, user.password)) return user;
        else return;
    }

    set username(value: string): void {
        this.set(this.constructor.usernameKey, value);
    }

    set email(value: string): void {
        enforce`${{ email: value }} as a string, and a valid email address`;
        this.set(this.constructor.emailKey, value);
    }

    set password(value: string): void {
        this.set(this.constructor.passwordKey, this.constructor._crypto.hash(value));
    }

    get username(): string {
        return this.get(this.constructor.usernameKey);
    }

    get email(): string {
        return this.get(this.constructor.emailKey);
    }

    get password(): string {
        return this._keyMap.get(this.constructor.passwordKey);
    }

    async beforeSave() {
        // Get username and email
        const username = this.username;
        const email = this.email;
        const password = this.password;

        // Check if username, email and password is provided
        if(this.isNew) {
            enforce`${{username}} as a string`;
            enforce`${{email}} as a string, and a valid email address`;
            enforce`${{password}} as a string`;
        }

        // Prepare filters
        const usernameWhere = new ConstraintMap();
        usernameWhere.equalTo(this.constructor.usernameKey, username);
        const emailWhere = new ConstraintMap();
        emailWhere.equalTo(this.constructor.emailKey, email);
        
        // Search for existing username
        const usernameMatch = (await this.constructor.find({ where: usernameWhere, skip: 0, limit: 1 })).first();
        if(typeof usernameMatch !== 'undefined') throw new Error(Error.Code.UsernameTaken, 'Username already taken');
        
        // Search for existing email
        const emailMatch = (await this.constructor.find({ where: emailWhere, skip: 0, limit: 1 })).first();
        if(typeof emailMatch !== 'undefined') throw new Error(Error.Code.EmailTaken, 'Email already taken');

        return;
    }
}

export default class User extends Model {

    static get Class(): typeof UserClass {
        return UserClass;
    }

}