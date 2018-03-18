import WarpServer from '../index';
import { ModelClass } from '../classes/model';
import ModelCollection from '../utils/model-collection';
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

    async find({ className, select, include, where, sort, skip, limit }: FindOptionsType): Promise<ModelCollection<ModelClass>> {
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
    
        // Get model
        const modelClass = this._api.models.get(className);
    
        // Find matching objects
        const modelCollection = await modelClass.find(query);
    
        // Return collection
        return modelCollection;
    }
    
    async get({ className, id, select, include }: GetOptionsType): Promise<ModelClass> {
        // Prepare query
        const query = {
            select: select || [],
            include: include || [],
            id
        };
    
        // Get model
        const modelClass = this._api.models.get(className);
    
        // Find matching objects
        const model = await modelClass.getById(query);
    
        // Check if model is found
        if(typeof model === 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, `Object \`${modelClass.className}\` with id \`${id}\` not found`);
    
        // Return the model
        return model;
    }
    
    async create({ Warp, metadata, currentUser, className, keys }: CreateOptionsType): Promise<ModelClass> {
        // Get model
        const modelClass = this._api.models.get(className);
        const model = new modelClass({ metadata, currentUser, keys });

        // Bind Warp
        model.bindSDK(Warp);
    
        // Save the object
        await model.save();
    
        // Return the model
        return model;
    }
    
    async update({ Warp, metadata, currentUser, className, keys, id }: UpdateOptionsType): Promise<ModelClass> {
        // Get model
        const modelClass = this._api.models.get(className);
        const model = new modelClass({ metadata, currentUser, keys, id });

        // Bind Warp
        model.bindSDK(Warp);
    
        // Save the object
        await model.save();
    
        // Return the model
        return model;
    }
    
   async destroy({ Warp, metadata, currentUser, className, id }: DestroyOptionsType): Promise<ModelClass> {
        // Get model
        const modelClass = this._api.models.get(className);
        const model = new modelClass({ metadata, currentUser, id });

        // Bind Warp
        model.bindSDK(Warp);
    
        // Destroy the object
        await model.destroy();
    
        // Return the model
        return model;
    }
}