// @flow
/**
 * References
 */
import WarpServer from '../index';
import Session from '../classes/session';
import ModelCollection from '../utils/model-collection';
import { Defaults } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import Error from '../utils/error';
import type { 
    GetOptionsType, 
    FindOptionsType
} from '../types/sessions';

export default class SessionController {

    _api: WarpServer;

    constructor(api: WarpServer) {
        this._api = api;
    }

    async find({ select, include, where, sort, skip, limit }: FindOptionsType): Promise<ModelCollection<Session.Class>> {
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
        const modelCollection = await modelClass.find(query);
    
        // Return collection
        return modelCollection;
    }
    
    async get({ id, select, include }: GetOptionsType): Promise<Session.Class> {
        // Prepare query
        const query = {
            select: select || [],
            include: include || [],
            id
        };
    
        // Get model
        const modelClass = this._api.auth.session();
    
        // Find matching objects
        const model = await modelClass.getById(query);
    
        // Check if model is found
        if(typeof model === 'undefined')
            throw new Error(Error.Code.ForbdiddenOperation, `Session with id \`${id}\` not found`);
    
        // Return the model
        return model;
    }
}