// @flow
/**
 * References
 */
import express from 'express';
import enforce from 'enforce-js';
import moment from 'moment-timezone';
import uniqid from 'uniqid';
import parseUrl from 'parse-url';
import Model from './classes/model';
import User from './classes/user';
import Function from './classes/function';
import Session from './classes/session';
import Database from './adapters/database';
import Logger from './adapters/logger';
import Crypto from './adapters/crypto';
import Error from './utils/error';
import { Subqueries } from './utils/constraint-map';
import type { ServerConfigType } from './types/server';
import type { SecurityConfigType } from './types/security';
import type { DatabaseOptionsType, IDatabaseAdapter } from './types/database';
import type { ThrottlingConfigType } from './types/throttling';
import type { ModelMapType, ModelFunctionsType } from './types/model';
import type { AuthMapType, AuthFunctionsType, AuthOptionsType } from './types/auth';
import type { FunctionMethodsType, FunctionMapType } from './types/functions';
import type { ResponseFunctionsType } from './types/response';
import type { ILogger } from './types/logger';
import middleware from './routes/middleware';
import classesRouter from './routes/classes';
import usersRouter  from './routes/users';
import sessionsRouter from './routes/sessions';
import functionsRouter from './routes/functions';

/**
 * Export classes
 */
export {
    Model,
    User,
    Session
};

/**
 * Extend enforce validations
 */
enforce.extend(/^equivalent to an array$/i, val => {
    try {
        const parsedValue = JSON.parse(val);
        if(parsedValue instanceof Array) return true;
        else return false;
    }
    catch(err) {
        return false;
    }
});

enforce.extend(/^equivalent to an object$/i, val => {
    try {
        const parsedValue = JSON.parse(val);
        if(typeof parsedValue === 'object') return true;
        else return false;
    }
    catch(err) {
        return false;
    }
});

enforce.extend(/^and a valid email address$/i, val => {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(val);
});

/**
 * @class WarpServer
 * @description WarpServer definition
 */
export default class WarpServer {

    /**
     * Private properties
     */
    
    _log: ILogger = Logger.use('console', 'Warp Server', process.env.LOG_LEVEL || 'error');
    _security: SecurityConfigType;
    _database: IDatabaseAdapter;
    _throttling: ThrottlingConfigType = { limit: 30, unit: 'second' };
    _models: ModelMapType = {};
    _auth: AuthMapType;
    _functions: FunctionMapType = {};
    _router: express.Router;
    _customResponse: boolean = false;

    /**
     * Constructor
     * @param {Object} config 
     */
    constructor({ 
        apiKey,
        masterKey,
        passwordSalt,
        sessionDuration,
        databaseURI,
        keepConnections,
        charset,
        timeout,
        requestLimit,
        customResponse
    }: ServerConfigType): void {
        // Set security
        this._setSecurity({ apiKey, masterKey, passwordSalt, sessionDuration });

        // Set database
        if(typeof databaseURI !== 'undefined')
            this._setDatabase({ databaseURI, keepConnections, charset, timeout });

        // Set throttling
        if(typeof requestLimit !== 'undefined')
            this._setThrottling({ limit: requestLimit, unit: 'second' });

        if(typeof customResponse !== 'undefined')
            this._customResponse = customResponse;
    }

    /**
     * Getters and Setters
     */

    get apiKey(): string {
        return this._security.apiKey;
    }

    get masterKey(): string {
        return this._security.masterKey;
    }

    get hasDatabase(): boolean {
        // Check if database is defined
        return typeof this._database !== 'undefined';
    }

    get throttling(): ThrottlingConfigType {
        return this._throttling;
    }

    get models(): ModelFunctionsType {
        return {
            add: (map: ModelMapType) => {
                // Enforce
                enforce`${{ 'models.add(map)': map }} as an object`;

                // Loop through each map item
                for(let key in map) {
                    // Get the model
                    let model = map[key];

                    // Get a sample instance
                    let modelInstance = new model;

                    // Enforce data type
                    enforce`${{ [model.className]: modelInstance }} as a ${{ 'Model.Class': Model.Class }}`;

                    // If model is an auth class
                    if(modelInstance instanceof User.Class || modelInstance instanceof Session.Class)
                        throw new Error(Error.Code.ForbiddenOperation, 'User and Session classes must be set using `auth` instead of `models`');
                    else // Otherwise, it is a regular class
                        this._models[model.className] = model.initialize(this._database);
                }
            },
            get: (className: string): typeof Model.Class => {
                try {
                    // Enforce
                    enforce`${{ className }} as a string`;

                    // Get the model
                    const modelClass = this._models[className];

                    // Enforce
                    enforce`${{ [className]: new modelClass }} as a ${{ 'Model.Class': Model.Class }}`;

                    // Return model
                    return modelClass;
                }
                catch(err) {
                    this._log.error(err, err.message);
                    throw new Error(Error.Code.ModelNotFound, `Model \`${className}\` does not exist`);
                }
            }
        };
    }

    get auth(): AuthFunctionsType {
        return {
            set: (user: typeof User.Class, session: typeof Session.Class) => {
                // Get sample instances
                let userInstance = new user;
                let sessionInstance = new session;

                // Enforce data type
                enforce`${{ [user.className]: userInstance }} as a ${{ 'User.Class': User.Class }}`;
                enforce`${{ [session.className]: sessionInstance }} as a ${{ 'Session.Class': Session.Class }}`;

                // Create and assign crypto to user
                const crypto = Crypto.use('bcrypt', this._security.passwordSalt);
                user.setCrypto(crypto);

                // Assign user to session
                session.setUser(user);

                // Set auth classes
                this._auth = { user: user.initialize(this._database), session: session.initialize(this._database) };
            },
            user: (): typeof User.Class => {
                // Check if auth exists
                if(typeof this._auth === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Authentication has not been defined');

                // Return model
                return this._auth.user;
            },
            session: (): typeof Session.Class => {
                // Check if auth exists
                if(typeof this._auth === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Authentication has not been defined');

                // Return model
                return this._auth.session;
            }
        };
    }

    get functions(): FunctionMethodsType {
        return {
            add: (map: FunctionMapType) => {
                // Enforce
                enforce`${{ 'functions.add(map)': map }} as an object`;

                // Loop through each map item
                for(let key in map) {
                    // Get the func
                    let func = map[key];

                    // Get a sample instance
                    let funcInstance = new func;

                    // Enforce data type
                    enforce`${{ [func.functionName]: funcInstance }} as a ${{ 'Function.Class': Function.Class }}`;

                    // Set function
                    this._functions[func.functionName] = func;
                }

            },
            get: (functionName: string) => {
                try {
                    // Enforce
                    enforce`${{ functionName }} as a string`;

                    // Get the function
                    const functionClass = this._functions[functionName];

                    // Enforce
                    enforce`${{ [functionName]: new functionClass }} as a ${{ 'Function.Class': Function.Class }}`;

                    // Return function
                    return functionClass;
                }
                catch(err) {
                    this._log.error(err, err.message);
                    throw new Error(Error.Code.FunctionNotFound, `Model \`${functionName}\` does not exist`);
                }
            }
        };
    }

    get response(): ResponseFunctionsType {
        return {
            success: (req: express.Request, res: express.Response, next: express.NextFunction) => {
                // Check if response success exists
                if(this._customResponse)
                    next();
                else {
                    res.status(200);
                    res.json({ result: req.result });
                }
            },
            error: (err: Error, req: express.Request, res: express.Response, next: express.NextFunction, ) => {
                // Check if response error exists
                if(this._customResponse)
                    next(err);
                else {
                    res.status(400);
                    res.json({ code: err.code, message: err.message });
                }
            }
        };
    }

    /**
     * Private methods
     */

     /**
      * Set security configuration
      * @param {Object} config
      */
    _setSecurity({ apiKey, masterKey, passwordSalt = 8, sessionDuration = '2 years' }: SecurityConfigType): void {
        // Enforce
        enforce`${{apiKey}} as a string`;
        enforce`${{masterKey}} as a string`;
        enforce`${{sessionDuration}} as an optional string`;
        
        // Set keys
        this._security = { 
            apiKey, 
            masterKey, 
            passwordSalt: passwordSalt, 
            sessionDuration: sessionDuration
        };
    }

     /**
      * Extract database configuration from URI
      * @param {Object} config
      */
    _extractDatabaseConfig(databaseURI: string) {
        const parsedURI = parseUrl(databaseURI);
        const identity = parsedURI.user.split(':');

        return {
            protocol: parsedURI.protocol,
            host: parsedURI.resource,
            port: parsedURI.port,
            user: identity[0],
            password: identity[1],
            schema: parsedURI.pathname.slice(1)
        };
    }

    /**
     * Set database configuration
     * @param {Object} config
     */
    _setDatabase({ databaseURI, keepConnections = false, charset = 'utf8mb4_unicode_ci', timeout = 30 * 1000 }: DatabaseOptionsType) {
        // Extract database config
        const { protocol, host, port, user, password, schema } = this._extractDatabaseConfig(databaseURI);

        // Enforce
        enforce`${{protocol}} as a string`;
        enforce`${{host}} as a string`;
        enforce`${{port}} as a number`;
        enforce`${{user}} as a string`;
        enforce`${{password}} as a string`;
        enforce`${{schema}} as a string`;
        enforce`${{keepConnections}} as a boolean`;
        enforce`${{charset}} as a string`;
        enforce`${{timeout}} as a number`;

        // Set database
        this._database = Database.use(protocol, {
            host,
            port,
            user,
            password,
            schema,
            keepConnections,
            charset,
            timeout
        });
    }

    /**
     * Set throttling configuration
     * @param {Object} config
     */
    _setThrottling({ 
        limit = 60, 
        unit = 'second' 
    }: ThrottlingConfigType) {
        // Enforce
        enforce`${{limit}} as a number`;
        enforce`${{unit}} as a string`;

        // Set values
        this._throttling = { limit, unit };
    }

    /**
     * Public methods
     */
    
    async initialize() {
        try {
            this._log.info('Starting Warp Server...');

            // Attempt to connect to the database
            if(this.hasDatabase) await this._database.initialize();


            // Display startup screen
            this._log.bare(`
            -------------------------------------------
            -------------------------------------------
            ------------------------------------=/-----
            ---------------------------------==/ ------
            -------------------------------==/  -------
            ----====|__    --====/   ----==/   --------
            ------=====|   --===/    ---==/   ---------
            -------====|   --==/     --==/   ----------
            --------===|   --=/  |   -==/   -----------
            ---------==|   --/  =|   ==/   ------------
            ----------=|   -/  ==|   =/   -------------
            ----------=|   /  -==|   /   --------------
            ----------=|     --==|      ---------------
            -------------------------------------------
            -------------------------------------------
            -------------------------------------------
                                                                                            
                         Warp Server ${require('../package.json').version}

            +-----------------------------------------+
            |     The server has been initialized     |
            +-----------------------------------------+
            `);
            this._log.info('Service started');
            if(!this.hasDatabase) this._log.info('NOTE: No database has been configured');
        }
        catch(err) {
            this._log.error(err, err.message);
        }
    }

    async authenticate({ sessionToken, username, email, password }: AuthOptionsType): Promise<User.Class | void> {
        // If session token is provided, search for the matching session
        if(typeof sessionToken !== 'undefined') {
            // Get session model
            const SessionModel = this.auth.session();
            
            // Verify session token
            const user = await SessionModel.verify(sessionToken);

            // Return user
            return user;
        }
        else if(typeof password !== 'undefined') {
            // Get user model
            const UserModel = this.auth.user();

            // Validate user credentials
            const user = await UserModel.verify({ username, email, password });

            // Return user
            return user;
        }

        return;
    }

    createSessionToken(user: User.Class) {
        return uniqid(`${(user.id * 1024 * 1024).toString(36)}-`) + (Math.random()*1e32).toString(36).slice(0, 8);
    }

    getRevocationDate() {
        const sessionDuration = this._security.sessionDuration.split(' ');
        return this._database.parseDate(moment().add(parseInt(sessionDuration[0]), sessionDuration[1]));
    }

    parseSubqueries(where: {[name: string]: {[name: string]: any}}): {[name: string]: {[name: string]: any}} {
        // Get auth classes
        const userClass = this.auth.user();
        const sessionClass = this.auth.session();

        // Iterate through the keys
        for(let key in where) {
            // Check if there are subquery constraints
            for(let index in Subqueries) {
                // Get constraint
                let constraint = Subqueries[index];

                // Check if the constraint exists
                if(typeof where[key][constraint] !== 'undefined') {                    
                    // Prepare subquery parameters
                    const subquery = where[key][constraint];
                    const subqueryModelClass = userClass.className === subquery.className? userClass 
                        : sessionClass.className === subquery.className? sessionClass
                            : this.models.get(subquery.className);
                    
                    // Set the new value for the constraint
                    where[key][constraint] = subqueryModelClass.getSubquery(subquery);
                }
            }
        }

        // Return the provided where map
        return where;
    }

    get router(): express.Router {
        // If a router has not yet been defined, prepare the router
        if(typeof this._router === 'undefined') {
            // Prepare routers
            const router = express.Router();
            router.use(middleware(this));
            router.use(classesRouter(this));
            router.use(usersRouter(this));
            router.use(sessionsRouter(this));
            router.use(functionsRouter(this));

            // Set the router value
            this._router = router;
        }

        // Return the router
        return this._router;
    }
}