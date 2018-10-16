import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { RateLimiter } from 'limiter';
import Error from '../utils/error';
import { WarpServer } from '../index';

const middleware = (api: WarpServer) => {
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
        const key = req.get('X-Warp-API-Key');

        if(!key || key !== api.apiKey) {
            const error = new Error(Error.Code.InvalidAPIKey, 'Invalid API Key');
            next(error);
        }
        else next();
    });

    // Return the router
    return router;
};

export default middleware;