import enforce from 'enforce-js';
import Model, { Pointer, ModelClass } from './model';
import { KeyManager } from './key';
import Error from '../utils/error';
import ConstraintMap from '../utils/constraint-map';
import { InternalKeys } from '../utils/constants';
import { ICryptoAdapter } from '../types/crypto';
import { CredentialsType } from '../types/auth';

export class UserClass extends ModelClass {

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

    static get keys(): Array<string | Pointer | KeyManager> {
        return [this.usernameKey, this.emailKey, this.passwordKey];
    }

    static get hidden(): Array<string> {
        return [this.passwordKey];
    }

    static setCrypto(crypto: ICryptoAdapter) {
        this._crypto = crypto;
    }

    static async verify<T extends UserClass>({ username, email, password }: CredentialsType): Promise<T | undefined> {
        // Prepare where clause
        const where = new ConstraintMap();
        
        // Determine whether to search by username or by email
        if(typeof username !== 'undefined') where.equalTo(this.usernameKey, username);
        else where.equalTo(this.emailKey, email);

        // Get matching user
        const result = await this.find<T>({ where, skip: 0, limit: 1 });
        const user = result.first();

        // If user is not found, return undefined
        if(typeof user === 'undefined') return;

        // Return user if the password is valid, else return undefined
        if(this._crypto.validate(password, user.password)) return user;
        else return;
    }

    set username(value: string) {
        this.set(this.statics<typeof UserClass>().usernameKey, value);
    }

    set email(value: string) {
        enforce`${{ email: value }} as a string, and a valid email address`;
        this.set(this.statics<typeof UserClass>().emailKey, value);
    }

    set password(value: string) {
        this.set(this.statics<typeof UserClass>().passwordKey, this.statics<typeof UserClass>()._crypto.hash(value));
    }

    get username(): string {
        return this.get(this.statics<typeof UserClass>().usernameKey);
    }

    get email(): string {
        return this.get(this.statics<typeof UserClass>().emailKey);
    }

    get password(): string {
        return this._keyMap.get(this.statics<typeof UserClass>().passwordKey);
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
            usernameWhere.equalTo(this.statics<typeof UserClass>().usernameKey, username);
            const emailWhere = new ConstraintMap();
            emailWhere.equalTo(this.statics<typeof UserClass>().emailKey, email);
            
            // Search for existing username
            const usernameMatch = (await this.statics<typeof UserClass>().find({ where: usernameWhere, skip: 0, limit: 1 })).first();
            if(typeof usernameMatch !== 'undefined') throw new Error(Error.Code.UsernameTaken, 'Username already taken');
            
            // Search for existing email
            const emailMatch = (await this.statics<typeof UserClass>().find({ where: emailWhere, skip: 0, limit: 1 })).first();
            if(typeof emailMatch !== 'undefined') throw new Error(Error.Code.EmailTaken, 'Email already taken');
        }

        return;
    }
}

export default class User extends Model {

    static get Class(): typeof UserClass {
        return UserClass;
    }

}