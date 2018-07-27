import enforce from 'enforce-js';
import Class from './class';
import Error from '../utils/error';
import ConstraintMap from '../utils/constraint-map';
import { InternalKeys } from '../utils/constants';

export default class User extends Class {

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

    static get roleKey(): string {
        return InternalKeys.Auth.Role;
    }

    static get keys(): Array<any> {
        return [this.usernameKey, this.emailKey, this.passwordKey];
    }

    static get hidden(): Array<string> {
        return [this.passwordKey];
    }

    set username(value: string) {
        this.set(this.statics<typeof User>().usernameKey, value);
    }

    set email(value: string) {
        enforce`${{ email: value }} as a string, and a valid email address`;
        this.set(this.statics<typeof User>().emailKey, value);
    }

    set password(value: string) {
        this.set(this.statics<typeof User>().passwordKey, value);
    }

    set role(value: string) {
        this.set(this.statics<typeof User>().roleKey, value);
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

    get role(): string {
        return this._keyMap.get(this.statics<typeof User>().roleKey);
    }

    async beforeSave() {
        // Check if username, email and password is provided
        if(this.isNew) {
            // Get username and email
            const username = this.username;
            const email = this.email;
            const password = this.password;
            const role = this.role;
            
            enforce`${{username}} as a string`;
            enforce`${{email}} as a string, and a valid email address`;
            enforce`${{password}} as a string`;
            enforce`${{role}} as an optional string`;
            
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