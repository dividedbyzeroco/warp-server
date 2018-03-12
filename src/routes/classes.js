// @flow
/**
 * References
 */
import express from 'express';
import enforce from 'enforce-js';
import WarpServer from '../index';
import ClassController from '../controllers/class';

/**
 * Define router
 */
const classes = (api: WarpServer): express.Router => {
    /**
     * Define controller
     */
    const controller = new ClassController(api);

    /**
     * Define router
     */
    const router = express.Router();

    /**
     * Finding objects
     */
    router.get('/classes/:className', async (req, res, next) => {
        // Get parameters
        const { className } = req.params;
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
            const modelCollection = await controller.find({ className, select, include, where, sort, skip, limit });

            // Return response
            req.result = modelCollection;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not find the objects for \`${className}\`: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });
    
    /**
    * Finding a single object
    */
   router.get('/classes/:className/:id', async (req, res, next) => {
        // Get parameters
        const { className, id } = req.params;
        let { select, include } = req.query;

        try {
            // Enforce
            enforce`${{ select }} as an optional string, equivalent to an array`;
            enforce`${{ include }} as an optional string, equivalent to an array`;

            // Parse parameters
            select = typeof select !== 'undefined' ? JSON.parse(select) : undefined;
            include = typeof include !== 'undefined' ? JSON.parse(include) : undefined;

            // $FlowFixMe
            const model = await controller.get({ className, id, select, include });

            // Return response
            req.result = model;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not find the object for \`${className}\`: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Creating objects
     */
    router.post('/classes/:className', async (req, res, next) => {
        // Get parameters
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { className } = req.params;
        const keys = req.body;

        try {
            // Create model
            const model = await controller.create({ metadata, currentUser, className, keys });

            // Return response
            req.result = model;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not create the object for \`${className}\`: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Updating objects
     */
    router.put('/classes/:className/:id', async (req, res, next) => {
        // Get parameters
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { className, id } = req.params;
        const keys = req.body;

        try {
            // Update model
            const model = await controller.update({ metadata, currentUser, className, keys, id });

            // Return response
            req.result = model;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not update the object for \`${className}\`: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Destroying objects
     */
    router.delete('/classes/:className/:id', async (req, res, next) => {
        // Get parameters
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { className, id } = req.params;

        try {
            // Destroy model
            const model = await controller.destroy({ metadata, currentUser, className, id });

            // Return response
            req.result = model;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not destroy the object for \`${className}\`: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    return router;
};

export default classes;