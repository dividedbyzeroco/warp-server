import * as express from 'express';
import enforce from 'enforce-js';
import WarpServer from '../index';
import SessionController from '../controllers/session';

/**
 * Define router    
 */
const sessions = (api: WarpServer): express.Router => {
    /**
     * Define controller
     */
    const controller = new SessionController(api);

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
            const modelCollection = await controller.find({ select, include, where, sort, skip, limit });

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
            const model = await controller.get({ id, select, include });

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