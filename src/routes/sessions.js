// @flow
/**
 * References
 */
import express from 'express';
import enforce from 'enforce-js';
import WarpServer from '../index';
import { Defaults } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import type { 
    FirstOptionsType, 
    FindOptionsType
} from '../types/sessions';

/**
 * Define routes
 */

export const find = async ({ api, select, include, where, sort, skip, limit }: FindOptionsType) => {
    // Parse subqueries
    where = api.parseSubqueries(where);

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
    const modelClass = api.auth.session();

    // Find matching objects
    const modelCollection = await modelClass.find(query);

    // Return collection
    return modelCollection;
};

export const first = async ({ api, id, select, include }: FirstOptionsType) => {
    // Enforce
    enforce`${{ select }} as an optional array`;
    enforce`${{ include }} as an optional array`;

    // Prepare query
    const query = {
        select: select || [],
        include: include || [],
        id
    };

    // Get model
    const modelClass = api.auth.session();

    // Find matching objects
    const model = await modelClass.first(query);

    // Return the model
    return model;
};

/**
 * Define router    
 */
const sessions = (api: WarpServer): express.Router => {
    /**
     * Define router
     */
    const router = express.Router();

    /**
     * Finding objects
     */
    router.get('/sessions', async (req, res, next) => {
        // Get parameters
        let { select, include, where, sort, skip, limit } = req.query;

        try {
            // Enforce
            enforce`${{ select }} as an optional string, equivalent to an array`;
            enforce`${{ include }} as an optional string, equivalent to an array`;
            enforce`${{ where }} as an optional string, equivalent to an object`;
            enforce`${{ sort }} as an optional string, equivalent to an array`;
            enforce`${{ skip }} as an optional number`;
            enforce`${{ limit }} as an optional number`;

            // Parse parameters
            select = typeof select !== 'undefined' ? JSON.parse(select) : undefined;
            include = typeof include !== 'undefined' ? JSON.parse(include) : undefined;
            where = typeof where !== 'undefined' ? JSON.parse(where) : undefined;
            sort = typeof sort !== 'undefined' ? JSON.parse(sort) : undefined;

            // $FlowFixMe
            const modelCollection = await find({ api, select, include, where, sort, skip, limit });

            // Return response
            req.result = modelCollection;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not find the sessions: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
    * Finding a single object
    */
   router.get('/sessions/:id', async (req, res, next) => {
       // Get parameters
       const { id } = req.params;
       let { select, include } = req.query;

       try {
            // Enforce
            enforce`${{ select }} as an optional string, equivalent to an array`;
            enforce`${{ include }} as an optional string, equivalent to an array`;

            // Parse parameters
            select = typeof select !== 'undefined' ? JSON.parse(select) : undefined;
            include = typeof include !== 'undefined' ? JSON.parse(include) : undefined;

           // $FlowFixMe
            const model = await first({ api, id, select, include });

            // Return response
            req.result = model;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not find the session: ${err.message}`);
            api.response.error(err, req, res, next);
        }
   });

    return router;
};

export default sessions;