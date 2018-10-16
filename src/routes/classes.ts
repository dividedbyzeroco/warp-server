import express from 'express';
import enforce from 'enforce-js';
import WarpServer from '../index';
import ClassController from '../controllers/class';
import { FindOptionsType, GetOptionsType } from '../types/classes';
import { InternalKeys } from '../utils/constants';

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
        const { select, include, where, sort, skip, limit } = req.query;
        const user = req[InternalKeys.Middleware.User];

        try {
            // Enforce
            enforce`${{ select }} as an optional string, equivalent to an array`;
            enforce`${{ include }} as an optional string, equivalent to an array`;
            enforce`${{ where }} as an optional string, equivalent to an object`;
            enforce`${{ sort }} as an optional string, equivalent to an array`;
            enforce`${{ skip }} as an optional number`;
            enforce`${{ limit }} as an optional number`;

            // Parse parameters
            const params: FindOptionsType = {
                className,
                select: typeof select !== 'undefined' ? JSON.parse(select) : undefined,
                include: typeof include !== 'undefined' ? JSON.parse(include) : undefined,
                where: typeof where !== 'undefined' ? JSON.parse(where) : undefined,
                sort: typeof sort !== 'undefined' ? JSON.parse(sort) : undefined,
                skip,
                limit,
                user
            };

            const classCollection = await controller.find(params);

            // Return response
            req[InternalKeys.Middleware.Result] = classCollection;
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
        const { select, include } = req.query;
        const user = req[InternalKeys.Middleware.User]; 

        try {
            // Enforce
            enforce`${{ select }} as an optional string, equivalent to an array`;
            enforce`${{ include }} as an optional string, equivalent to an array`;

            // Parse parameters
            const params: GetOptionsType = {
                className,
                id,
                select: typeof select !== 'undefined' ? JSON.parse(select) : undefined,
                include: typeof include !== 'undefined' ? JSON.parse(include) : undefined,
                user
            };

            const classInstance = await controller.get(params);

            // Return response
            req[InternalKeys.Middleware.Result] = classInstance;
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
        const { className } = req.params;
        const keys = req.body;
        const user = req[InternalKeys.Middleware.User];

        try {
            // Create class
            const classInstance = await controller.create({ className, keys, user });

            // Return response
            req[InternalKeys.Middleware.Result] = classInstance;
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
        const { className, id } = req.params;
        const keys = req.body;
        const user = req[InternalKeys.Middleware.User];

        try {
            // Update class
            const classInstance = await controller.update({ className, keys, id, user });

            // Return response
            req[InternalKeys.Middleware.Result] = classInstance;
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
        const { className, id } = req.params;
        const user = req[InternalKeys.Middleware.User];

        try {
            // Destroy class
            const classInstance = await controller.destroy({ className, id, user });

            // Return response
            req[InternalKeys.Middleware.Result] = classInstance;
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