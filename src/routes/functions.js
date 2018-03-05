// @flow
/**
 * References
 */
import express from 'express';
import WarpServer from '../index';
import type { RunOptionsType } from '../types/functions';

/**
 * Define routes
 */

export const run = async ({ api, metadata, currentUser, functionName, keys }: RunOptionsType) => {
    // Get function
    const functionClass = api.functions.get(functionName);
    const func = new functionClass({ metadata, currentUser, keys });

    // Run the function
    const result = await func.run();

    // Return the result
    return result;
};

/**
 * Define router
 */
const functions = (api: WarpServer): express.Router => {
    /**
     * Define router
     */
    const router = express.Router();

    /**
     * Running functions
     */
    router.post('/functions/:functionName', async (req, res, next) => {
        // Get parameters
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { functionName } = req.params;
        const keys = req.body;

        try {
            // Run function
            const result = await run({ api, metadata, currentUser, functionName, keys });

            // Return response
            req.result = result;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not run the function \`${functionName}\`: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    return router;
};

export default functions;