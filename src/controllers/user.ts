import WarpServer from '../index';
import User from '../features/auth/user';
import Collection from '../utils/collection';
import { Defaults } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import Error from '../utils/error';
import { 
    GetOptionsType, 
    FindOptionsType, 
    CreateOptionsType, 
    UpdateOptionsType,
    DestroyOptionsType
} from '../types/users';

export default class UserController {

    _api: WarpServer;

    constructor(api: WarpServer) {
        this._api = api;
    }

    async find({ select, include, where = {}, sort, skip, limit }: FindOptionsType): Promise<any> { // Promise<Collection<User>> {
        // // Prepare query
        // const query = {
        //     select,
        //     include,
        //     where: new ConstraintMap(where),
        //     sort: sort || Defaults.Query.Sort,
        //     skip: skip || Defaults.Query.Skip,
        //     limit: limit || Defaults.Query.Limit
        // };
    
        // // Get class
        // const classType = this._api.auth.user();
    
        // // Find matching objects
        // const classCollection = await classType.find<User>(query);
    
        // // Return collection
        // return classCollection;
    }
    
    async get({ id, select, include }: GetOptionsType): Promise<any> { // Promise<User> {    
        // // Prepare query
        // const query = {
        //     select: select || [],
        //     include: include || [],
        //     id
        // };
    
        // // Get class
        // const classType = this._api.auth.user();
    
        // // Find matching object
        // const classInstance = await classType.getById<User>(query);
    
        // // Check if class is found
        // if(typeof classInstance === 'undefined')
        //     throw new Error(Error.Code.ForbiddenOperation, `User with id \`${id}\` not found`);
    
        // // Return the class
        // return classInstance;
    }
    
    async create({ currentUser, keys }: CreateOptionsType): Promise<any> { // Promise<User> {
        // // Check if session token is provided
        // if(!metadata.isMaster && typeof currentUser !== 'undefined')
        //     throw new Error(Error.Code.ForbiddenOperation, 'Users cannot be created using an active session. Please log out.');
    
        // // Get class
        // const classType = this._api.auth.user();
        // const classInstance = new classType({ metadata, currentUser, keys });

        // // Bind Warp
        // classInstance.bindSDK(Warp);
    
        // // Save the object
        // await classInstance.save();
    
        // // Return the class
        // return classInstance;
    }
    
    async update({ currentUser, keys, id }: UpdateOptionsType): Promise<any> { // Promise<User> {
        // // Check if the editor is the same user
        // if(!metadata.isMaster && (typeof currentUser === 'undefined' || currentUser.id !== id))
        //     throw new Error(Error.Code.ForbiddenOperation, 'User details can only be edited by their owner or via master');
    
        // // Get class
        // const classType = this._api.auth.user();
        // const classInstance = new classType({ metadata, currentUser, keys, id });
    
        // // Bind Warp
        // classInstance.bindSDK(Warp);

        // // Save the object
        // await classInstance.save();
    
        // // Return the class
        // return classInstance;
    }
    
    async destroy({ currentUser, id }: DestroyOptionsType): Promise<any> { // Promise<User> {
        // // Check if the destroyer is the same user
        // if(!metadata.isMaster && (typeof currentUser === 'undefined' || currentUser.id !== id))
        //     throw new Error(Error.Code.ForbiddenOperation, 'User details can only be destroyed by their owner or via master');
    
        // // Get class
        // const classType = this._api.auth.user();
        // const classInstance = new classType({ metadata, currentUser, id });
    
        // // Bind Warp
        // classInstance.bindSDK(Warp);

        // // Destroy the object
        // await classInstance.destroy();
    
        // // Return the class
        // return classInstance;
    }
}