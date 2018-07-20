import WarpServer from '../index';
import User from '../classes/user';
import Session from '../classes/session';
import ClassCollection from '../utils/class-collection';
import { Defaults } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import Error from '../utils/error';
import { 
    GetOptionsType, 
    FindOptionsType, 
    CreateOptionsType, 
    UpdateOptionsType,
    DestroyOptionsType,
    LoginOptionsType,
    MeOptionsType,
    LogoutOptionsType
} from '../types/users';
import KeyMap from '../utils/key-map';

export default class UserController {

    _api: WarpServer;

    constructor(api: WarpServer) {
        this._api = api;
    }

    async find({ select, include, where = {}, sort, skip, limit }: FindOptionsType): Promise<ClassCollection<User>> {
        // Parse subqueries
        where = this._api.parseSubqueries(where);
    
        // Prepare query
        const query = {
            select,
            include,
            where: new ConstraintMap(where),
            sort: sort || Defaults.Query.Sort,
            skip: skip || Defaults.Query.Skip,
            limit: limit || Defaults.Query.Limit
        };
    
        // Get class
        const classType = this._api.auth.user();
    
        // Find matching objects
        const classCollection = await classType.find<User>(query);
    
        // Return collection
        return classCollection;
    }
    
    async get({ id, select, include }: GetOptionsType): Promise<User> {    
        // Prepare query
        const query = {
            select: select || [],
            include: include || [],
            id
        };
    
        // Get class
        const classType = this._api.auth.user();
    
        // Find matching object
        const classInstance = await classType.getById<User>(query);
    
        // Check if class is found
        if(typeof classInstance === 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, `User with id \`${id}\` not found`);
    
        // Return the class
        return classInstance;
    }
    
    async create({ Warp, metadata, currentUser, keys }: CreateOptionsType): Promise<User> {
        // Check if session token is provided
        if(!metadata.isMaster && typeof currentUser !== 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, 'Users cannot be created using an active session. Please log out.');
    
        // Get class
        const classType = this._api.auth.user();
        const classInstance = new classType({ metadata, currentUser, keys });

        // Bind Warp
        classInstance.bindSDK(Warp);
    
        // Save the object
        await classInstance.save();
    
        // Return the class
        return classInstance;
    }
    
    async update({ Warp, metadata, currentUser, keys, id }: UpdateOptionsType): Promise<User> {
        // Check if the editor is the same user
        if(!metadata.isMaster && (typeof currentUser === 'undefined' || currentUser.id !== id))
            throw new Error(Error.Code.ForbiddenOperation, 'User details can only be edited by their owner or via master');
    
        // Get class
        const classType = this._api.auth.user();
        const classInstance = new classType({ metadata, currentUser, keys, id });
    
        // Bind Warp
        classInstance.bindSDK(Warp);

        // Save the object
        await classInstance.save();
    
        // Return the class
        return classInstance;
    }
    
    async destroy({ Warp, metadata, currentUser, id }: DestroyOptionsType): Promise<User> {
        // Check if the destroyer is the same user
        if(!metadata.isMaster && (typeof currentUser === 'undefined' || currentUser.id !== id))
            throw new Error(Error.Code.ForbiddenOperation, 'User details can only be destroyed by their owner or via master');
    
        // Get class
        const classType = this._api.auth.user();
        const classInstance = new classType({ metadata, currentUser, id });
    
        // Bind Warp
        classInstance.bindSDK(Warp);

        // Destroy the object
        await classInstance.destroy();
    
        // Return the class
        return classInstance;
    }
    
    async logIn({ Warp, metadata, currentUser, username, email, password }: LoginOptionsType): Promise<Session> {
        // Get session class
        const Session = this._api.auth.session();
    
        // Check if session token is provided
        if(typeof currentUser !== 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, 'Cannot log in using an active session. Please log out.');
    
        // Authenticate the user
        const user = await this._api.authenticate({ username, email, password });
    
        // If no user found
        if(!(user instanceof this._api.auth.user()))
            throw new Error(Error.Code.InvalidCredentials, 'Invalid username/password');

        // Convert user to pointer
        user.toPointer();
    
        // If the user is found, create a new session
        const keys = {
            [Session.userKey]: user.toJSON(),
            [Session.originKey]: metadata.client,
            [Session.sessionTokenKey]: this._api.createSessionToken(user),
            [Session.revokedAtKey]: this._api.getRevocationDate()
        };
    
        const session = new Session({ metadata, keys });

        // Bind Warp
        session.bindSDK(Warp);
    
        // Save the new session
        await session.save();
    
        // Return the session
        return session;
    }
    
    async me({ currentUser }: MeOptionsType): Promise<User> {
        // Check if currentUser exists
        if(typeof currentUser === 'undefined')
            throw new Error(Error.Code.InvalidSessionToken, 'Session does not exist');
        
        // Return the current user
        return currentUser;
    }
    
    async logOut({ Warp, sessionToken }: LogoutOptionsType): Promise<Session> {
        // Get session class
        const Session = this._api.auth.session();
    
        // Find provided session
        const session = await Session.getFromToken(sessionToken);
    
        if(typeof session === 'undefined')
            throw new Error(Error.Code.InvalidSessionToken, 'Session does not exist');
    
        // Bind Warp
        session.bindSDK(Warp);

        // Destroy the session
        await session.destroy();
    
        // Return the session
        return session;
    }
}