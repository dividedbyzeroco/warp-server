import WarpServer from '../index';
import Class from '../classes/class';
import ClassCollection from '../utils/class-collection';
import Error from '../utils/error';
import { Defaults } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import { 
    GetOptionsType, 
    FindOptionsType, 
    CreateOptionsType, 
    UpdateOptionsType, 
    DestroyOptionsType 
} from '../types/classes';

export default class ClassController {

    _api: WarpServer;

    constructor(api: WarpServer) {
        this._api = api;
    }

    async find({ className, select, include, where = {}, sort, skip, limit }: FindOptionsType): Promise<ClassCollection<Class>> {
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
        const classType = this._api.classes.get(className);
    
        // Find matching objects
        const classCollection = await classType.find(query);
    
        // Return collection
        return classCollection;
    }
    
    async get({ className, id, select, include }: GetOptionsType): Promise<Class> {
        // Prepare query
        const query = {
            select: select || [],
            include: include || [],
            id
        };
    
        // Get class
        const classType = this._api.classes.get(className);
    
        // Find matching objects
        const classInstance = await classType.getById(query);
    
        // Check if class is found
        if(typeof classInstance === 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, `Object \`${classType.className}\` with id \`${id}\` not found`);
    
        // Return the class
        return classInstance;
    }
    
    async create({ Warp, metadata, currentUser, className, keys }: CreateOptionsType): Promise<Class> {
        // Get class
        const classType = this._api.classes.get(className);
        const classInstance = new classType({ metadata, currentUser, keys });

        // Bind Warp
        classInstance.bindSDK(Warp);
    
        // Save the object
        await classInstance.save();
    
        // Return the class
        return classInstance;
    }
    
    async update({ Warp, metadata, currentUser, className, keys, id }: UpdateOptionsType): Promise<Class> {
        // Get class
        const classType = this._api.classes.get(className);
        const classInstance = new classType({ metadata, currentUser, keys, id });

        // Bind Warp
        classInstance.bindSDK(Warp);
    
        // Save the object
        await classInstance.save();
    
        // Return the class
        return classInstance;
    }
    
   async destroy({ Warp, metadata, currentUser, className, id }: DestroyOptionsType): Promise<Class> {
        // Get class
        const classType = this._api.classes.get(className);
        const classInstance = new classType({ metadata, currentUser, id });

        // Bind Warp
        classInstance.bindSDK(Warp);
    
        // Destroy the object
        await classInstance.destroy();
    
        // Return the class
        return classInstance;
    }
}