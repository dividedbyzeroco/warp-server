import express from 'express';
import Warp from '../index';
import FunctionController from '../controllers/function';
import { InternalKeys } from '../utils/constants';
import Error from '../utils/error';

/**
 * Define router
 */
const functions = (api: Warp): express.Router => {
    /**
     * Define controller
     */
    const controller = new FunctionController(api);

    /**
     * Define router
     */
    const router = express.Router();

    /**
     * Running functions
     */
    router.use('/functions/:functionName', async (req, res, next) => {
        // Get parameters
        const { functionName } = req.params;
        const user = req[InternalKeys.Middleware.User];
        const keys = req.method.toLowerCase() === 'get' ? req.query : req.body;

        try {
            // Run function
            const result = await controller.run({ functionName, keys, user });

            // Return response
            req[InternalKeys.Middleware.Result] = result;
            api.response.success(req, res, next);
        } catch (err) {
            // Check if function was not found
            if (err.code === Error.Code.FunctionNotFound) {
                api.logger.warn(err, `Could not run the function \`${functionName}\`: ${err.message}`);
                next();
            } else {
                api.logger.error(err, `Could not run the function \`${functionName}\`: ${err.message}`);
                api.response.error(err, req, res, next);
            }
        }
    });

    return router;
};

export default functions;