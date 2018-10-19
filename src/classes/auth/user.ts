import enforce from 'enforce-js';
import Class from '../class';
import Error from '../../utils/error';
import ConstraintMap from '../../utils/constraint-map';
import { InternalKeys } from '../../utils/constants';
import { Key } from '../..';

export default class User extends Class {

    async beforeSave() {
        // Check if username, email and password is provided
        if(this.isNew) {
            // // Get username and email
            // const username = this.username;
            // const email = this.email;
            // const password = this.password;
            // const role = this.role;
            
            // enforce`${{username}} as a string`;
            // enforce`${{email}} as a string, and a valid email address`;
            // enforce`${{password}} as a string`;
            // enforce`${{role}} as an optional string`;
            
            // // Prepare filters
            // const usernameWhere = new ConstraintMap();
            // usernameWhere.equalTo(this.statics<typeof User>().usernameKey, username);
            // const emailWhere = new ConstraintMap();
            // emailWhere.equalTo(this.statics<typeof User>().emailKey, email);
            
            // // Search for existing username
            // const usernameMatch = (await this.statics<typeof User>().find({ where: usernameWhere, skip: 0, limit: 1 })).first();
            // if(typeof usernameMatch !== 'undefined') throw new Error(Error.Code.UsernameTaken, 'Username already taken');
            
            // // Search for existing email
            // const emailMatch = (await this.statics<typeof User>().find({ where: emailWhere, skip: 0, limit: 1 })).first();
            // if(typeof emailMatch !== 'undefined') throw new Error(Error.Code.EmailTaken, 'Email already taken');
        }

        return;
    }
}