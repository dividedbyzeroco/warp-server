import WarpServer from '../index';
import Class from '../classes/class';
import User from '../classes/auth/user';
import Collection from '../utils/collection';
import Error from '../utils/error';
import ConstraintMap from '../utils/constraint-map';
import { 
    GetOptionsType, 
    FindOptionsType, 
    CreateOptionsType, 
    UpdateOptionsType, 
    DestroyOptionsType 
} from '../types/classes';
import { AccessType } from '../types/scope';
import Query from '../classes/query';

export default class ClassController {

    _api: WarpServer;

    constructor(api: WarpServer) {
        this._api = api;
    }
    
    async checkAccess(user: User | null, classType: typeof Class, action: AccessType, where: ConstraintMap) {
        // Return the where clause if user is null
        // TODO: Prevent anonymous requests unless explicitly stated
        if(user === null) return where;

        // Apply role
        const roleClass = this._api.roles.get(user.role);
        const role = new roleClass;

        // Set the current user
        role.setUser(user); 

        // Get accessibility
        const accessibility = await role.can(action, classType, where);
        
        return accessibility;
    }

    async find({ user, className, select, include, where = {}, sort, skip, limit }: FindOptionsType): Promise<Collection<Class>> {
        // Get class
        const classType = this._api.classes.get(className);

        // Prepare query
        const query = new Query(classType);

        // Set options
        if(typeof select !== 'undefined') query.select(select);
        if(typeof include !== 'undefined') query.include(include);
        if(typeof sort !== 'undefined') query._sort = sort;
        if(typeof skip !== 'undefined') query.skip(skip);
        if(typeof limit !== 'undefined') query.limit(limit);
        if(typeof where !== 'undefined') query._where = new ConstraintMap(where);
    
        // Find matching objects
        const classCollection = await this._api.classes.find(query);
    
        // Return collection
        return classCollection;
    }
    
    async get({ user, className, id, select, include }: GetOptionsType): Promise<Class> {
        // Get class
        const classType = this._api.classes.get(className);
    
        // Find matching objects
        const classInstance = await this._api.classes.getById(classType, id, select, include);
    
        // Check if class is found
        if(classInstance === null)
            throw new Error(Error.Code.ForbiddenOperation, `Object \`${classType.className}\` with id \`${id}\` not found`);
    
        // Return the class
        return classInstance;
    }
    
    async create({ user, className, keys }: CreateOptionsType): Promise<Class> {
        // Get class
        const classType = this._api.classes.get(className);

        // Prepare instance
        const classInstance = new classType({ keys });

        // Save the instance
        await this._api.classes.save(classInstance);
    
        // Return the class
        return classInstance;
    }
    
    async update({ user, className, keys, id }: UpdateOptionsType): Promise<Class> {
        // Get class
        const classType = this._api.classes.get(className);

        // Prepare instance
        const classInstance = new classType({ keys, id });
    
        // Save the instance
        await this._api.classes.save(classInstance);
    
        // Return the class
        return classInstance;
    }
    
   async destroy({ user, className, id }: DestroyOptionsType): Promise<Class> {
        // Get class
        const classType = this._api.classes.get(className);

        // Prepare instance
        const classInstance = new classType({ id });
    
        // Destroy the instance
        await this._api.classes.destroy(classInstance);
    
        // Return the class
        return classInstance;
    }
}