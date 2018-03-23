import WarpServer from '../index';
import { SessionClass } from '../classes/session';
import ModelCollection from '../utils/model-collection';
import { Defaults } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import Error from '../utils/error';
import { 
    GetOptionsType, 
    FindOptionsType
} from '../types/sessions';

export default class SessionController {

    _api: WarpServer;

    constructor(api: WarpServer) {
        this._api = api;
    }

    async find({ select, include, where = {}, sort, skip, limit }: FindOptionsType): Promise<ModelCollection<SessionClass>> {
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
        const modelClass = this._api.auth.session();
    
        // Find matching objects
        const modelCollection = await modelClass.find<SessionClass>(query);
    
        // Return collection
        return modelCollection;
    }
    
    async get({ id, select, include }: GetOptionsType): Promise<SessionClass> {
        // Prepare query
        const query = {
            select: select || [],
            include: include || [],
            id
        };
    
        // Get model
        const modelClass = this._api.auth.session();
    
        // Find matching objects
        const model = await modelClass.getById<SessionClass>(query);
    
        // Check if model is found
        if(typeof model === 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, `Session with id \`${id}\` not found`);
    
        // Return the model
        return model;
    }
}