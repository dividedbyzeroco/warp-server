// @flow
/**
 * References
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { RateLimiter } from 'limiter';
import { Warp } from 'warp-sdk-js';
import WarpServer from '../index';
import Error from '../utils/error';

const middleware = (api: WarpServer) => {
    /**
     * Define router
     */
    const router = express.Router();
    
    /**
     * Middleware for enabling CORS
     */
    router.use(cors());

    /**
     * Body parser
     */
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: false }));

    /**
     * Get client, sdk and app versions
     */
   router.use((req, res, next) => {
        req.metadata = {
            sessionToken: req.get('X-Warp-Session-Token'),
            client: req.get('X-Warp-Client'),
            sdkVersion: req.get('X-Warp-Client-Version'),
            appVersion: req.get('X-App-Version'),
            isMaster: req.get('X-Warp-Master-Key') === api.masterKey
        };
        next();
    });

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

    /**
     * Request rate limiter
     */
    router.use((req, res, next) => {
        const limiter = new RateLimiter(api.throttling.limit, api.throttling.unit, true);
        limiter.removeTokens(1, (err, remainingRequests) => {
            if(remainingRequests < 1) {
                const error = new Error(Error.Code.TooManyRequests, 'Too Many Requests');
                next(error);
            }
            else next();
        });
    });

    /**
     * Get current user
     */
    router.use(async (req, res, next) => {
        try {
            const sessionToken = req.metadata.sessionToken;
            if(typeof sessionToken === 'undefined') return next();
            req.currentUser = await api.authenticate({ sessionToken });
            next();
        }
        catch(err) {
            api._log.error(err, 'Could not get current user:', err.message);
            next(err);
        }
    });

    /**
     * Create a new Warp instance
     */
    router.use((req, res, next) => {
        const sessionToken = req.metadata.sessionToken;
        const currentUser = req.currentUser;
        req.Warp = new Warp({ platform: 'api', api, sessionToken, currentUser });
        next();
    });

    // Return the router
    return router;
};

export default middleware;