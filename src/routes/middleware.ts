import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Error from '../utils/error';
import { Warp } from '../index';
import { InternalKeys } from '../utils/constants';

const middleware = (api: Warp) => {
    /**
     * Define router
     */
    const router = express.Router();
    
    /**
     * Enable CORS
     */
    router.use(cors());

    /**
     * Body parser
     */
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: false }));

    /**
     * Require API Keys for all requests
     */
    router.use((req, res, next) => {
        const key = req.get(InternalKeys.Middleware.ApiKey);

        if(!key || key !== api.apiKey) {
            const error = new Error(Error.Code.InvalidAPIKey, 'Invalid API Key');
            next(error);
        }
        else next();
    });

    /**
     * Add the data mapper to req.classes
     */
    router.use((req, res, next) => {
        // Add the data mapper to the request
        req[InternalKeys.Middleware.ClassManager] = api.classes;
        next();
    });

    // Return the router
    return router;
};

export default middleware;