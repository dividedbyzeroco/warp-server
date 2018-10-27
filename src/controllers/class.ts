import WarpServer from '../index';
import Class from '../features/orm/class';
import Collection from '../utils/collection';
import Error from '../utils/error';
import { 
    GetOptionsType, 
    FindOptionsType, 
    CreateOptionsType, 
    UpdateOptionsType, 
    DestroyOptionsType 
} from '../types/classes';
import Query from '../features/orm/query';
import { InternalKeys } from '../utils/constants';

export default class ClassController {

    private api: WarpServer;

    constructor(api: WarpServer) {
        this.api = api;
    }

    async find({ user, className, select, include, where = {}, sort, skip, limit }: FindOptionsType): Promise<Collection<Class>> {
        // Get class
        const classType = this.api.classes.get(className);

        // Prepare query
        const query = new Query(classType);

        // Set options
        if(typeof select !== 'undefined') query.select(select);
        if(typeof include !== 'undefined') query.include(include);
        if(typeof sort !== 'undefined') query.sortBy(sort);
        if(typeof skip !== 'undefined') query.skip(skip);
        if(typeof limit !== 'undefined') query.limit(limit);
        if(typeof where !== 'undefined') query.where(where);
    
        // Find matching objects
        const classCollection = await this.api.classes.find(query, { user: user || undefined });
    
        // Return collection
        return classCollection;
    }
    
    async get({ user, className, id, include, select }: GetOptionsType): Promise<Class> {
        // Get class
        const classType = this.api.classes.get(className);
    
        // Find matching objects
        const classInstance = await this.api.classes.getById(classType, id, include, select, { user: user || undefined });
    
        // Check if class is found
        if(classInstance === null)
            throw new Error(Error.Code.ForbiddenOperation, `Object \`${classType.className}\` with id \`${id}\` not found`);
    
        // Return the class
        return classInstance;
    }
    
    async create({ user, className, keys = {} }: CreateOptionsType): Promise<Class> {
        // Get class
        const classType = this.api.classes.get(className);

        // Check if id was sent in keys
        if(typeof keys[InternalKeys.Id] === 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, 'Cannot manually set the `id` key on creation');

        // Prepare instance
        const classInstance = new classType(keys);

        // Save the instance
        await this.api.classes.save(classInstance, { user: user || undefined });
    
        // Return the class
        return classInstance;
    }
    
    async update({ user, className, keys = {}, id }: UpdateOptionsType): Promise<Class> {
        // Get class
        const classType = this.api.classes.get(className);

        // Prepare instance
        const classInstance = new classType({ ...keys, id });
    
        // Save the instance
        await this.api.classes.save(classInstance, { user: user || undefined });
    
        // Return the class
        return classInstance;
    }
    
   async destroy({ user, className, id }: DestroyOptionsType): Promise<Class> {
        // Get class
        const classType = this.api.classes.get(className);

        // Prepare instance
        const classInstance = new classType(id);
    
        // Destroy the instance
        await this.api.classes.destroy(classInstance, { user: user || undefined });
    
        // Return the class
        return classInstance;
    }
}