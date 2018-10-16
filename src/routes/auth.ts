import express from 'express';
import WarpServer from '..';
import Error from '../utils/error';
import { InternalKeys } from '../utils/constants';

const auth = (api: WarpServer) => {
    /**
     * Define router
     */
    const router = express.Router();

    /**
     * Get access token
     */
    router.use((req, res, next) => {
        // Get parameters
        const { headers, query } = req;

        // Check if authorization is set
        if(typeof headers !== 'undefined' && typeof headers.authorization !== 'undefined') {
            // Split auth parts
            const authParts = typeof headers.authorization === 'string' ? 
                headers.authorization.split(' ') : headers.authorization;

            // Check auth length
            if(authParts.length === 2 && authParts[0].toLowerCase() === InternalKeys.Auth.Bearer) {
                // Set access token
                req[InternalKeys.Middleware.AccessToken] = authParts[1];
            }
            else return next(new Error(Error.Code.ForbiddenOperation, 'Invalid authorization header'));
        }
        
        // Check if access token is in the query
        if(typeof query !== 'undefined' && typeof query[InternalKeys.Auth.AccessToken] !== 'undefined') {
            // If access token already exists, throw an error
            if(typeof req[InternalKeys.Middleware.AccessToken] !== 'undefined')
                return next(new Error(Error.Code.ForbiddenOperation, 'Access token can only be declared once'));

            // Assign the access token
            req[InternalKeys.Middleware.AccessToken] = query[InternalKeys.Auth.AccessToken];
        }
        
        // Continue
        next();
    });

    // Return the router
    return router;
};

export default auth;