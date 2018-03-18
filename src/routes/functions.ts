import * as express from 'express';
import WarpServer from '../index';
import FunctionController from '../controllers/function';

/**
 * Define router
 */
const functions = (api: WarpServer): express.Router => {
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
    router.post('/functions/:functionName', async (req, res, next) => {
        // Get parameters
        const Warp = req.Warp;
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { functionName } = req.params;
        const keys = req.body;

        try {
            // Run function
            const result = await controller.run({ Warp, metadata, currentUser, functionName, keys });

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