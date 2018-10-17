import WarpServer from '../index';
import Session from '../classes/auth/session';
import Collection from '../utils/collection';
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

    async find({ select, include, where = {}, sort, skip, limit }: FindOptionsType): Promise<Collection<Session>> {
        // Validate master access
        if(!metadata.isMaster)
            throw new Error(Error.Code.ForbiddenOperation, 'Only masters can access sessions');
    
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
        const classType = this._api.auth.session();
    
        // Find matching objects
        const classCollection = await classType.find<Session>(query);
    
        // Return collection
        return classCollection;
    }
    
    async get({ id, select, include }: GetOptionsType): Promise<Session> {
        // Validate master access
        if(!metadata.isMaster)
            throw new Error(Error.Code.ForbiddenOperation, 'Only masters can access sessions');

        // Prepare query
        const query = {
            select: select || [],
            include: include || [],
            id
        };
    
        // Get class
        const classType = this._api.auth.session();
    
        // Find matching objects
        const classInstance = await classType.getById<Session>(query);
    
        // Check if class is found
        if(typeof classInstance === 'undefined')
            throw new Error(Error.Code.ForbiddenOperation, `Session with id \`${id}\` not found`);
    
        // Return the class
        return classInstance;
    }
}