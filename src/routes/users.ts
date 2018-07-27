import express from 'express';
import enforce from 'enforce-js';
import WarpServer from '../index';
import UserController from '../controllers/user';
import { FindOptionsType } from '../types/users';

/**
 * Define router    
 */
const users = (api: WarpServer): express.Router => {
    /**
     * Define controller
     */
    const controller = new UserController(api);

    /**
     * Define router
     */
    const router = express.Router();

    /**
     * Finding objects
     */
    router.get('/users', async (req, res, next) => {
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
            const params: FindOptionsType = {
                select: typeof select !== 'undefined' ? JSON.parse(select) : undefined,
                include: typeof include !== 'undefined' ? JSON.parse(include) : undefined,
                where: typeof where !== 'undefined' ? JSON.parse(where) : undefined,
                sort: typeof sort !== 'undefined' ? JSON.parse(sort) : undefined,
                skip,
                limit
            };

            const classCollection = await controller.find(params);

            // Return response
            req.result = classCollection;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not find the users: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });
    
    /**
    * Finding a single object
    */
   router.get('/users/:id', async (req, res, next) => {
       // Get parameters
       const { id } = req.params;
       const currentUser = req.currentUser;

       try {
            let { select, include } = req.query;

            // Enforce
            enforce`${{ select }} as an optional string, equivalent to an array`;
            enforce`${{ include }} as an optional string, equivalent to an array`;

            // Parse parameters
            const params = {
                id,
                select: typeof select !== 'undefined' ? JSON.parse(select) : undefined,
                include: typeof include !== 'undefined' ? JSON.parse(include) : undefined
            };
            
            const classInstance = await controller.get(params);

            // Return response
            req.result = classInstance;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not find the user: ${err.message}`);
            api.response.error(err, req, res, next);
        }
   });

    /**
     * Creating objects
     */
    router.post('/users', async (req, res, next) => {
        // Get parameters
        const Warp = req.Warp;
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const keys = req.body;

        try {
            // Create class
            const classInstance = await controller.create({ Warp, metadata, currentUser, keys });

            // Return response
            req.result = classInstance;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not create the user: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Updating objects
     */
    router.put('/users/:id', async (req, res, next) => {
        // Get parameters
        const Warp = req.Warp;
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { id } = req.params;
        const keys = req.body;

        try {
            // Update class
            const classInstance = await controller.update({ Warp, metadata, currentUser, keys, id });

            // Return response
            req.result = classInstance;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not update the user: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Destroying objects
     */
    router.delete('/users/:id', async (req, res, next) => {
        // Get parameters
        const Warp = req.Warp;
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { id } = req.params;

        try {
            // Destroy class
            const classInstance = await controller.destroy({ Warp, metadata, currentUser, id });

            // Return response
            req.result = classInstance;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not destroy the user: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    return router;
};

export default users;