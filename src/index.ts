import * as express from 'express';
import * as uniqid from 'uniqid';
import * as parseUrl from 'parse-url';
import enforce from 'enforce-js';
import Model from './classes/model'
import User, { UserClass } from './classes/user';
import Function from './classes/function';
import Session, { SessionClass } from './classes/session';
import Key from './classes/key';
import Database from './adapters/database';
import Logger from './adapters/logger';
import Crypto from './adapters/crypto';
import Error from './utils/error';
import { Subqueries } from './utils/constraint-map';
import { addToDate, toDatabaseDate } from './utils/format';
import { ServerConfigType } from './types/server';
import { SecurityConfigType } from './types/security';
import { DatabaseOptionsType, IDatabaseAdapter } from './types/database';
import { ThrottlingConfigType } from './types/throttling';
import { ModelMapType, ModelFunctionsType } from './types/model';
import { AuthMapType, AuthFunctionsType, AuthOptionsType } from './types/auth';
import { FunctionMethodsType, FunctionMapType } from './types/functions';
import { ResponseFunctionsType } from './types/response';
import { ILogger } from './types/logger';
import middleware from './routes/middleware';
import classesRouter from './routes/classes';
import usersRouter from './routes/users';
import sessionsRouter from './routes/sessions';
import functionsRouter from './routes/functions';
import ClassController from './controllers/class';
import UserController from './controllers/user';
import SessionController from './controllers/session';
import FunctionController from './controllers/function';
import { InternalKeys } from './utils/constants';
import chalk from 'chalk';

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
    
    _log: ILogger = Logger.use('console', 'Warp Server', process.env.LOG_LEVEL || 'error');
    _security: SecurityConfigType;
    _database: IDatabaseAdapter;
    _throttling: ThrottlingConfigType = { limit: 30, unit: 'second' };
    _models: ModelMapType = {};
    _auth: AuthMapType;
    _functions: FunctionMapType = {};
    _router: express.Router;
    _customResponse: boolean = false;
    _supportLegacy: boolean = false;
    _classController: ClassController = new ClassController(this);
    _userController: UserController = new UserController(this);
    _sessionController: SessionController = new SessionController(this);
    _functionController: FunctionController = new FunctionController(this);

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
        customResponse,
        supportLegacy
    }: ServerConfigType) {
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

        if(typeof supportLegacy !== 'undefined')
            this._supportLegacy = supportLegacy;
    }

    /**
     * API Key
     */
    get apiKey(): string {
        return this._security.apiKey;
    }

    /**
     * Master Key
     */
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

    /**
     * Model operations
     */
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
                    if(modelInstance instanceof UserClass || modelInstance instanceof SessionClass)
                        throw new Error(Error.Code.ForbiddenOperation, 'User and Session classes must be set using `auth` instead of `models`');
                    else // Otherwise, it is a regular class
                        this._models[model.className] = model.initialize(this._database, this._supportLegacy);
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

    /**
     * Authentication operations
     */
    get auth(): AuthFunctionsType {
        return {
            exists: () => {
                if(typeof this._auth === 'object' 
                    && typeof this._auth.user !== 'undefined' 
                    && typeof this._auth.session !== 'undefined')
                        return true;
                else
                    return false;
            },
            set: (user: typeof UserClass, session: typeof SessionClass) => {
                // Check if auth models are set
                if(typeof user === 'undefined' || typeof session === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Both User and Session classes must be defined');

                // Get sample instances
                let userInstance = new user;
                let sessionInstance = new session;

                // Enforce data type
                enforce`${{ [user.className]: userInstance }} as a ${{ 'User.Class': UserClass }}`;
                enforce`${{ [session.className]: sessionInstance }} as a ${{ 'Session.Class': SessionClass }}`;

                // Create and assign crypto to user
                const crypto = Crypto.use('bcrypt', this._security.passwordSalt || 8);
                user.setCrypto(crypto);

                // Assign user to session
                session.setUser(user);

                // Set auth classes
                this._auth = { 
                    user: user.initialize<typeof UserClass>(this._database, this._supportLegacy), 
                    session: session.initialize<typeof SessionClass>(this._database, this._supportLegacy) 
                };
            },
            user: (): typeof UserClass => {
                // Check if auth exists
                if(typeof this._auth === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Authentication has not been defined');

                // Return model
                return this._auth.user;
            },
            session: (): typeof SessionClass => {
                // Check if auth exists
                if(typeof this._auth === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Authentication has not been defined');

                // Return model
                return this._auth.session;
            }
        };
    }

    /**
     * Function operations
     */
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
                    throw new Error(Error.Code.FunctionNotFound, `Function \`${functionName}\` does not exist`);
                }
            }
        };
    }

    /**
     * Response format
     */
    get response(): ResponseFunctionsType {
        return {
            success: (req: express.Request, res: express.Response, next: express.NextFunction) => {
                // Check if response success exists
                if(this._customResponse)
                    next();
                else {
                    // Set result
                    const result = req.result;

                    // Set status and response
                    res.status(200);
                    res.json({ result });
                }
            },
            error: (err: Error, req: express.Request, res: express.Response, next: express.NextFunction, ) => {
                // Check if response error exists
                if(this._customResponse)
                    next(err);
                else {
                    // Set code and message
                    let status = err.status;
                    let code = err.code;
                    let message = err.message;

                    // Check error code
                    if(typeof err.code === 'undefined') {
                        code = 400;
                    }
                    else if(err.code === Error.Code.DatabaseError) {
                        message = 'Invalid query request';
                    }

                    // Set status
                    res.status(status || 400);
                    res.json({ code, message });
                }
            }
        };
    }

    /**
     * Set security configuration
     * @param {Object} config
     */
    private _setSecurity({ apiKey, masterKey, passwordSalt = 8, sessionDuration = '2 years' }: SecurityConfigType): void {
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
    private _extractDatabaseConfig(databaseURI: string) {
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
    private _setDatabase({ databaseURI, keepConnections = false, charset = 'utf8mb4_unicode_ci', timeout = 30 * 1000 }: DatabaseOptionsType) {
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
    private _setThrottling({ 
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
     * Initialize the server and connect to the database
     */
    async initialize() {
        try {
            this._log.info('Starting Warp Server...');

            // Attempt to connect to the database
            if(this.hasDatabase) await this._database.initialize();


            // Display startup screen
            this._log.bare(chalk.yellow(`
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
            `));
            this._log.info('Service started');
            if(!this.hasDatabase) this._log.info('NOTE: No database has been configured');
        }
        catch(err) {
            this._log.error(err, err.message);
        }
    }

    /**
     * Authenticate a sessionToken, username, email, or password
     * @param {AuthOptionsType} options
     */
    async authenticate({ sessionToken, username, email, password }: AuthOptionsType): Promise<UserClass | undefined> {
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

    createSessionToken(user: UserClass) {
        return uniqid(`${(user.id * 1024 * 1024).toString(36)}-`) + (Math.random()*1e32).toString(36).slice(0, 8);
    }

    getRevocationDate() {
        if(typeof this._security.sessionDuration === 'string') {
            const sessionDuration = this._security.sessionDuration.split(' ');
            const duration: number = parseInt(sessionDuration[0]);
            const unit: string = sessionDuration[1];
            const date = new Date();
            return addToDate(date.toISOString(), duration, unit).toISOString();
        }
        return;
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
                    // Get className format          
                    const className = this._supportLegacy? InternalKeys.Pointers.LegacyClassName : InternalKeys.Pointers.ClassName;   
                      
                    // Prepare subquery parameters
                    const subquery = where[key][constraint];
                    const subqueryModelClass = userClass.className === subquery[className]? userClass 
                        : sessionClass.className === subquery[className]? sessionClass
                            : this.models.get(subquery[className]);
                    
                    // Set the new value for the constraint
                    where[key][constraint] = subqueryModelClass.getSubquery(subquery);
                }
            }
        }

        // Return the provided where map
        return where;
    }

    /**
     * Get express router
     */
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

export {
    Model,
    User,
    Session,
    Function,
    Key,
    WarpServer
};