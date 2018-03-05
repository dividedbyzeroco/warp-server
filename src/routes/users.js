// @flow
/**
 * References
 */
import express from 'express';
import enforce from 'enforce-js';
import WarpServer from '../index';
import { Defaults } from '../utils/constants';
import ConstraintMap from '../utils/constraint-map';
import Error from '../utils/error';
import type { 
    FirstOptionsType, 
    FindOptionsType, 
    CreateOptionsType, 
    UpdateOptionsType,
    DestroyOptionsType,
    LoginOptionsType,
    MeOptionsType,
    LogoutOptionsType
} from '../types/users';

/**
 * Define routes
 */

export const find = async ({ api, select, include, where, sort, skip, limit }: FindOptionsType) => {
    // Parse subqueries
    where = api.parseSubqueries(where);

    // Prepare query
    const query = {
        select,
        include,
        where: new ConstraintMap(where),
        sort: sort || Defaults.Query.Sort,
        skip: skip || Defaults.Query.Skip,
        limit: limit || Defaults.Query.Limit
    };

    // Get model
    const modelClass = api.auth.user();

    // Find matching objects
    const modelCollection = await modelClass.find(query);

    // Return collection
    return modelCollection;
};

export const first = async ({ api, id, select, include }: FirstOptionsType) => {
    // Enforce
    enforce`${{ select }} as an optional array`;
    enforce`${{ include }} as an optional array`;

    // Prepare query
    const query = {
        select: select || [],
        include: include || [],
        id
    };

    // Get model
    const modelClass = api.auth.user();

    // Find matching objects
    const model = await modelClass.first(query);

    // Return the model
    return model;
};

export const create = async ({ api, metadata, currentUser, keys }: CreateOptionsType) => {
    // Check if session token is provided
    if(typeof currentUser !== 'undefined')
        throw new Error(Error.Code.ForbdiddenOperation, 'Users cannot be created using an active session. Please log out.');

    // Get model
    const modelClass = api.auth.user();
    const model = new modelClass({ metadata, currentUser, keys });

    // Save the object
    await model.save();

    // Return the model
    return model;
};

export const update = async ({ api, metadata, currentUser, keys, id }: UpdateOptionsType) => {
    // Check if the editor is the same user
    if(!metadata.isMaster && (typeof currentUser === 'undefined' || currentUser.id !== id))
        throw new Error(Error.Code.ForbdiddenOperation, 'User details can only be edited by their owner or via master');

    // Get model
    const modelClass = api.auth.user();
    const model = new modelClass({ metadata, currentUser, keys, id });

    // Save the object
    await model.save();

    // Return the model
    return model;
};

export const destroy = async({ api, metadata, currentUser, id }: DestroyOptionsType) => {
    // Check if the destroyer is the same user
    if(!metadata.isMaster && (typeof currentUser === 'undefined' || currentUser.id !== id))
        throw new Error(Error.Code.ForbdiddenOperation, 'User details can only be destroyed by their owner or via master');

    // Get model
    const modelClass = api.auth.user();
    const model = new modelClass({ metadata, currentUser, id });

    // Destroy the object
    await model.destroy();

    // Return the model
    return model;
};

export const logIn = async({ api, metadata, currentUser, username, email, password }: LoginOptionsType) => {
    // Get session class
    const sessionClass = api.auth.session();

    // Check if session token is provided
    if(typeof currentUser !== 'undefined')
        throw new Error(Error.Code.ForbdiddenOperation, 'Cannot log in using an active session. Please log out.');

    // Authenticate the user
    const user = await api.authenticate({ username, email, password });

    // If no user found
    if(!(user instanceof api.auth.user()))
        throw new Error(Error.Code.InvalidCredentials, 'Invalid username/password');

    // If the user is found, create a new session
    const keys = {
        [sessionClass.userKey]: user.toPointer().toJSON(),
        [sessionClass.originKey]: metadata.client,
        [sessionClass.sessionTokenKey]: api.createSessionToken(user),
        [sessionClass.revokedAtKey]: api.getRevocationDate()
    };

    const session = new sessionClass({ metadata, keys });

    // Save the new session
    await session.save();

    // Return the session
    return session;
};

export const me = async({ currentUser }: MeOptionsType) => {
    // Check if currentUser exists
    if(typeof currentUser === 'undefined')
        throw new Error(Error.Code.InvalidSessionToken, 'Session does not exist');
    
    // Return the current user
    return currentUser;
};

export const logOut = async({ api, sessionToken }: LogoutOptionsType) => {
    // Get session class
    const sessionClass = api.auth.session();

    // Find provided session
    const session = await sessionClass.getFromToken(sessionToken);

    if(typeof session === 'undefined')
        throw new Error(Error.Code.InvalidSessionToken, 'Session does not exist');

    // Destroy the session
    await session.destroy();

    // Return the session
    return session;
};

/**
 * Define router    
 */
const users = (api: WarpServer): express.Router => {
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
            select = typeof select !== 'undefined' ? JSON.parse(select) : undefined;
            include = typeof include !== 'undefined' ? JSON.parse(include) : undefined;
            where = typeof where !== 'undefined' ? JSON.parse(where) : undefined;
            sort = typeof sort !== 'undefined' ? JSON.parse(sort) : undefined;

            // $FlowFixMe
            const modelCollection = await find({ api, select, include, where, sort, skip, limit });

            // Return response
            req.result = modelCollection;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not find the users: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Getting user behind a session token
     */
    router.get('/users/me', async (req, res, next) => {
        // Get parameters
        const currentUser = req.currentUser;

        try {
            // Get user
            const user = await me({ currentUser });

            // Return response
            req.result = user;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not log in: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });
    
    /**
    * Finding a single object
    */
   router.get('/users/:id', async (req, res, next) => {
       // Get parameters
       const { id } = req.params;
       let { select, include } = req.query;

       try {
            // Enforce
            enforce`${{ select }} as an optional string, equivalent to an array`;
            enforce`${{ include }} as an optional string, equivalent to an array`;

            // Parse parameters
            select = typeof select !== 'undefined' ? JSON.parse(select) : undefined;
            include = typeof include !== 'undefined' ? JSON.parse(include) : undefined;

           // $FlowFixMe
            const model = await first({ api, id, select, include });

            // Return response
            req.result = model;
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
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const keys = req.body;

        try {
            // Create model
            const model = await create({ api, metadata, currentUser, keys });

            // Return response
            req.result = model;
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
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { id } = req.params;
        const keys = req.body;

        try {
            // Update model
            const model = await update({ api, metadata, currentUser, keys, id });

            // Return response
            req.result = model;
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
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { id } = req.params;

        try {
            // Destroy model
            const model = await destroy({ api, metadata, currentUser, id });

            // Return response
            req.result = model;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not destroy the user: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Logging in
     */
    router.post('/login', async (req, res, next) => {
        // Get parameters
        const metadata = req.metadata;
        const currentUser = req.currentUser;
        const { username, email, password } = req.body;

        try {
            // Get session
            const session = await logIn({ api, metadata, currentUser, username, email, password });

            // Return response
            req.result = session;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not log in: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    /**
     * Logging out
     */
    router.post('/logout', async (req, res, next) => {
        // Get parameters
        const { sessionToken } = req.metadata;

        try {
            // Log out of session
            const session = await logOut({ api, sessionToken });

            // Return response
            req.result = session;
            api.response.success(req, res, next);
        }
        catch(err) {
            api._log.error(err, `Could not log out: ${err.message}`);
            api.response.error(err, req, res, next);
        }
    });

    return router;
};

export default users;