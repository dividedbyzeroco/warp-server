import express from 'express';
import parseUrl from 'parse-url';
import enforce from 'enforce-js';
import Class from './classes/class'
import User from './classes/user';
import Function from './classes/function';
import Session from './classes/session';
import Key from './classes/key';
import Scope from './classes/scope';
import Role from './classes/role';
import Database from './adapters/database';
import Logger from './adapters/logger';
import Error from './utils/error';
import { Subqueries } from './utils/constraint-map';
import { ServerConfigType } from './types/server';
import { SecurityConfigType } from './types/security';
import { DatabaseOptionsType } from './types/database';
import { ClassMapType, ClassFunctionsType } from './types/class';
import { AuthFunctionsType } from './types/auth';
import { FunctionMethodsType, FunctionMapType } from './types/functions';
import { ResponseFunctionsType } from './types/response';
import { ILogger } from './types/logger';
import middleware from './routes/middleware';
import classesRouter from './routes/classes';
import usersRouter from './routes/users';
import functionsRouter from './routes/functions';
import ClassController from './controllers/class';
import UserController from './controllers/user';
import SessionController from './controllers/session';
import FunctionController from './controllers/function';
import { InternalKeys } from './utils/constants';
import chalk from 'chalk';
import Auth from './classes/auth';
import Client from './classes/client';
import { RoleFunctionsType, RoleMapType } from './types/roles';
import Repository from './classes/repository';

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
    _repository: Repository;
    _classes: ClassMapType = {};
    _functions: FunctionMapType = {};
    _roles: RoleMapType = {};
    _auth: Auth;
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
        databaseURI,
        keepConnections,
        charset,
        timeout,
        accessExpiry,
        sessionRevocation,
        passwordSalt = 8,
        customResponse,
        supportLegacy
    }: ServerConfigType) {
        // Set security
        this._setSecurity({ apiKey, masterKey });

        // Set auth
        // TODO: Move this out of Warp
        if(typeof accessExpiry !== 'undefined') {
            this._setAuth({ accessExpiry, sessionRevocation, passwordSalt });
        }
        // Set database
        if(typeof databaseURI !== 'undefined')
            this._setRepository({ databaseURI, keepConnections, charset, timeout });

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
        return typeof this._repository !== 'undefined';
    }

    /**
     * Class operations
     */
    get classes(): ClassFunctionsType {
        return {
            add: (map: ClassMapType) => {
                // Enforce
                enforce`${{ 'classes.add(map)': map }} as an object`;

                // Loop through each map item
                for(let key in map) {
                    // Get the class
                    let classType = class extends map[key] {};

                    // Get a sample instance
                    let classInstance = new classType;

                    // Enforce data type
                    enforce`${{ [classType.className]: classInstance }} as a ${{ 'Class': Class }}`;

                    // If class is an auth class
                    if(classInstance instanceof User || classInstance instanceof Session || classInstance instanceof Client)
                        throw new Error(Error.Code.ForbiddenOperation, 'User, Session, and Client classes must be set using `auth` instead of `classes`');
                    else {
                        // Otherwise, it is a regular class
                        classType.initialize(this._supportLegacy);                  
                        this._classes[classType.className] = classType;
                    }
                }
            },
            get: (className: string): typeof Class => {
                try {
                    // Enforce
                    enforce`${{ className }} as a string`;

                    // Get the class
                    const classType = this._classes[className];

                    // Enforce
                    enforce`${{ [className]: new classType }} as a ${{ 'Class': Class }}`;

                    // Return class
                    return classType;
                }
                catch(err) {
                    this._log.error(err, err.message);
                    throw new Error(Error.Code.ClassNotFound, `Class \`${className}\` does not exist`);
                }
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
                    enforce`${{ [func.functionName]: funcInstance }} as a ${{ 'Function.Class': Function }}`;

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
                    enforce`${{ [functionName]: new functionClass }} as a ${{ 'Function.Class': Function }}`;

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
     * Role operations
     */
    get roles(): RoleFunctionsType {
        return {
            add: (map: RoleMapType) => {
                // Enforce
                enforce`${{ 'roles.add(map)': map }} as an object`;

                // Loop through each map item
                for(let key in map) {
                    // Get the role
                    let role = map[key];

                    // Get a sample instance
                    let roleInstance = new role;

                    // Enforce data type
                    enforce`${{ [role.roleName]: roleInstance }} as a ${{ 'Role.Class': Role }}`;

                    // Set function
                    this._roles[role.roleName] = role;
                }

            },
            get: (roleName: string) => {
                try {
                    // Enforce
                    enforce`${{ roleName }} as a string`;

                    // Get the role
                    const roleClass = this._roles[roleName];

                    // Enforce
                    enforce`${{ [roleName]: new roleClass }} as a ${{ 'Role.Class': Role }}`;

                    // Return role
                    return roleClass;
                }
                catch(err) {
                    this._log.error(err, err.message);
                    throw new Error(Error.Code.MissingConfiguration, `Role \`${roleName}\` does not exist`);
                }
            }
        };
    }

    /**
     * Authentication operations
     */
    get auth(): AuthFunctionsType {
        return {
            use: (user: typeof User, session: typeof Session, client: typeof Client) => {
                // Check if auth classes are set
                if(typeof user === 'undefined' || typeof session === 'undefined' || typeof client === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'User, Session and Client classes must be defined');

                // Get sample instances
                let userInstance = new user;
                let sessionInstance = new session;
                let clientInstance = new client;

                // Enforce data type
                enforce`${{ [user.className]: userInstance }} as a ${{ 'User': User }}`;
                enforce`${{ [session.className]: sessionInstance }} as a ${{ 'Session': Session }}`;
                enforce`${{ [client.className]: clientInstance }} as a ${{ 'Client': Client }}`;

                // Assign user and client to session
                session.setUser(user);
                session.setClient(client);

                // Set auth classes
                user.initialize<typeof User>(this._supportLegacy);
                session.initialize<typeof Session>(this._supportLegacy);
                client.initialize<typeof Client>(this._supportLegacy);

                // Set auth instance
                this._auth = new Auth(user, session, client);
            },
            user: (): typeof User => {
                // Check if auth exists
                if(typeof this._auth === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Authentication has not been defined');

                // Return class
                return this._auth.user;
            },
            session: (): typeof Session => {
                // Check if auth exists
                if(typeof this._auth === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Authentication has not been defined');

                // Return class
                return this._auth.session;
            },
            client: (): typeof Client => {
                // Check if auth exists
                if(typeof this._auth === 'undefined')
                    throw new Error(Error.Code.MissingConfiguration, 'Authentication has not been defined');
                
                // Return class
                return this._auth.client;
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
                    const result = req[InternalKeys.Middleware.Result];

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
    private _setSecurity({ apiKey, masterKey }: SecurityConfigType): void {
        // Enforce
        enforce`${{apiKey}} as a string`;
        enforce`${{masterKey}} as a string`;
        
        // Set keys
        this._security = { 
            apiKey, 
            masterKey
        };
    }

    /**
     * Set auth configuration
     * @param databaseURI
     */
    private _setAuth({ accessExpiry, sessionRevocation, passwordSalt }): void {
        // Set default auth
        this.auth.use(User, Session, Client);

        // Enforce
        enforce`${{accessExpiry}} as an optional string`;
        enforce`${{sessionRevocation}} as an optional string`;
        enforce`${{passwordSalt}} as an optional number`;

        // Set expiry, revocation, and password salt
        if(typeof accessExpiry !== 'undefined') this._auth.expiry = accessExpiry;
        if(typeof sessionRevocation !== 'undefined') this._auth.revocation = sessionRevocation;
        if(typeof passwordSalt !== 'undefined') this._auth.salt = passwordSalt;
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
     * Set database repository configuration
     * @param {Object} config
     */
    private _setRepository({ databaseURI, keepConnections = false, charset = 'utf8mb4_unicode_ci', timeout = 30 * 1000 }: DatabaseOptionsType) {
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

        // Prepare database
        const database = Database.use(protocol, {
            host,
            port,
            user,
            password,
            schema,
            keepConnections,
            charset,
            timeout
        });

        // Set repository
        this._repository = new Repository(database);
    }

    /**
     * Initialize the server and connect to the database
     */
    async initialize() {
        try {
            this._log.info('Starting Warp Server...');

            // Attempt to connect to the database
            if(this.hasDatabase) await this._repository.initialize();


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

    parseSubqueries(where: {[name: string]: {[name: string]: any}}): {[name: string]: {[name: string]: any}} {
        // Get auth classes
        const User = this.auth.user();
        const Session = this.auth.session();

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
                    const subqueryClass = User.className === subquery[className]? User 
                        : Session.className === subquery[className]? Session
                            : this.classes.get(subquery[className]);
                    
                    // Set the new value for the constraint
                    where[key][constraint] = subqueryClass.getSubquery(subquery);
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
            router.use(functionsRouter(this));

            // Set the router value
            this._router = router;
        }

        // Return the router
        return this._router;
    }
}

export {
    Class,
    User,
    Session,
    Client,
    Function,
    Key,
    Scope,
    Role,
    WarpServer
};