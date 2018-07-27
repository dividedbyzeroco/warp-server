import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { RateLimiter } from 'limiter';
import { Warp } from 'warp-sdk-js';
import Error from '../utils/error';
import { WarpServer } from '../index';
import { InternalKeys } from '../utils/constants';

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
     * Get access token
     */
    router.use((req, res, next) => {
        // Get parameters
        const { headers, query } = req;

        // Check if authorization is set
        if(typeof headers !== 'undefined' && typeof headers.authorization !== 'undefined') {
            // Split auth parts
            const authParts = headers.authorization.split(' ');

            // Check auth length
            if(authParts.length === 2 && authParts[0].toLowerCase() === InternalKeys.Auth.Bearer) {
                // Set access token
                req.accessToken = authParts[1];
            }
            else return next(new Error(Error.Code.ForbiddenOperation, 'Invalid authorization header'));
        }
        
        // Check if access token is in the query
        if(typeof query !== 'undefined' && typeof query[InternalKeys.Auth.AccessToken] !== 'undefined') {
            // If access token already exists, throw an error
            if(typeof req.accessToken !== 'undefined')
                return next(new Error(Error.Code.ForbiddenOperation, 'Access token can only be declared once'));

            // Assign the access token
            req.accessToken = query[InternalKeys.Auth.AccessToken];
        }
        
        // Continue
        next();
    });

    /**
     * Get client, sdk and app versions
     */
   router.use((req, res, next) => {
        req.metadata = {
            accessToken: req.accessToken,
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
     * Create a new Warp instance
     */
    router.use((req, res, next) => {
        const { accessToken } = req.metadata;
        const currentUser = req.currentUser;
        req.Warp = new Warp({ platform: 'api', api, apiKey: req.metadata.apiKey, sessionToken: accessToken, currentUser });
        next();
    });

    // Return the router
    return router;
};

export default middleware;