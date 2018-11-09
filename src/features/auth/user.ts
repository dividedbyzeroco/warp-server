import Class from '../orm/class';
import Key from '../orm/keys/key';
import Error from '../../utils/error';
import Query from '../orm/query';
import { InternalKeys } from '../../utils/constants';
import { ClassManager } from '../..';
import { ClassOptions } from '../../types/class';
import { BeforeFind, BeforeGet, BeforeSave, BeforeDestroy } from '../orm/keys/modifiers/triggers';

@Class.definition
export default class User extends Class {

    @Key username: string;
    @Key email: string;
    @Key password: string;
    @Key role: string;
    @Key counter: number;

    private isCurrentUser(user: User | undefined) {
        return typeof user !== 'undefined' && user.id === this.id;
    }

    private isMaster(master: boolean | undefined) {
        return typeof master === 'boolean' && master;
    }

    private hasAccess(user: User | undefined, master: boolean | undefined) {
        return this.isCurrentUser(user) || this.isMaster(master);
    }

    @BeforeFind
    verifyFindAccess<Q extends Query<any>, U extends User | undefined>(query: Q, opts: ClassOptions<U>) {
        // Get opts
        const { master } = opts;

        // If user does not have access
        if(!this.isMaster(master))
            throw new Error(Error.Code.ForbiddenOperation, 'Finding users can only be done by the master');
    }

    @BeforeGet
    verifyGetAccess<Q extends Query<any>, U extends User | undefined>(query: Q, opts: ClassOptions<U>): any {
        // Get opts
        const { user, master } = opts;

        // If user is master
        if(this.isMaster) return query;
        else if(!this.hasAccess(user, master)) {
            if(user) query.equalTo(InternalKeys.Id, user.id);
            else throw new Error(Error.Code.ForbiddenOperation, 'You cannot anonymously fetch user data unless you are a master');
        }
    }

    @BeforeSave
    async validateCredentials<U extends User | undefined>(classes: ClassManager, opts: ClassOptions<U>) {
        // If creating a user, make sure it is unique
        if(this.isNew) {
            // Check if user exists
            const usernameQuery = new Query(User)
                .equalTo(InternalKeys.Auth.Username, this.username);
            const emailQuery = new Query(User)
                .equalTo(InternalKeys.Auth.Email, this.email);
            const matchQuery = new Query(User)
                .foundInEither(InternalKeys.Id, [
                    { [InternalKeys.Id]: usernameQuery },
                    { [InternalKeys.Id]: emailQuery }
                ]);

            // Get match
            const match = await classes.first(matchQuery);

            // Check if match exists
            if(match !== null) {
                if(match.username === this.username)
                    throw new Error(Error.Code.UsernameTaken, 'Username already taken');
                else if(match.email === this.email)
                    throw new Error(Error.Code.EmailTaken, 'Email already taken');
            }
        }
    }

    @BeforeSave
    verifyUpdateAccess<U extends User | undefined>(classes: ClassManager, opts: ClassOptions<U>) {
        // Get opts
        const { user, master } = opts;

        // If user does not have access
        if(!this.isNew && !this.hasAccess(user, master)) {
            throw new Error(Error.Code.ForbiddenOperation, 'You cannot edit the data of another user unless you are a master');
        }
    }

    @BeforeDestroy
    verifyDestroyAccess<U extends User | undefined>(classes, opts: ClassOptions<U>) {
        // Get opts
        const { user, master } = opts;

        // If user does not have access
        if(!this.hasAccess(user, master)) {
            throw new Error(Error.Code.ForbiddenOperation, 'You cannot remove the data of another user unless you are a master');
        }
    }

}