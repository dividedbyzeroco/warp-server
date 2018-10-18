import { Router } from 'express';
import parseUrl from 'parse-url';
import enforce from 'enforce-js';
import Class from './classes/class'
import Query from './classes/query';
import User from './classes/auth/user';
import Function from './classes/function';
import Session from './classes/auth/session';
import Key from './classes/keys/key';
import DataMapper from './classes/data-mapper';
import Database from './adapters/database';
import Logger from './adapters/logger';
import { ServerConfigType } from './types/server';
import { SecurityConfigType } from './types/security';
import { DatabaseOptionsType } from './types/database';
import { ResponseFunctionsType } from './types/response';
import { ILogger } from './types/logger';
import middleware from './routes/middleware';
import classesRouter from './routes/classes';
import usersRouter from './routes/users';
import functionsRouter from './routes/functions';
import ClassController from './controllers/class';
import FunctionController from './controllers/function';
import chalk from 'chalk';
import Response from './utils/response';

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
    
    private _logger: ILogger;
    private _security: SecurityConfigType;
    private _dataMapper: DataMapper;
    _router: Router;
    _response: Response;
    _supportLegacy: boolean = false;
    _classController: ClassController = new ClassController(this);
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
        customResponse,
        supportLegacy
    }: ServerConfigType) {
        // Set logger
        this.setLogger('console');

        // Set security
        this.setSecurity({ apiKey, masterKey });

        // Set database
        this.setDataMapper({ databaseURI, keepConnections, charset, timeout });

        // Set response format
        this.setResponse(customResponse);

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
        return typeof this._dataMapper !== 'undefined';
    }

    /**
     * Class operations
     */
    get classes(): DataMapper {
        return this._dataMapper;
    }

    /**
     * Logger
     */
    get logger(): ILogger {
        return this._logger;
    }

    /**
     * Response format
     */
    get response(): ResponseFunctionsType {
        return this._response;
    }

    /**
     * Set logger
     * @param customResponse
     */
    private setLogger(channel: string) {
        this._logger = Logger.use(channel, 'Warp Server', process.env.LOG_LEVEL || 'error');
    }

    /**
     * Set security configuration
     * @param {Object} config
     */
    private setSecurity({ apiKey, masterKey }: SecurityConfigType): void {
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
     * Extract database configuration from URI
     * @param {Object} config
     */
    private extractDatabaseConfig(databaseURI: string) {
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
     * Set data mapper configuration
     * @param {Object} config
     */
    private setDataMapper({ databaseURI, keepConnections = false, charset = 'utf8mb4_unicode_ci', timeout = 30 * 1000 }: DatabaseOptionsType) {
        // Enforce databaseURI format
        enforce`${{ databaseURI }} as a string`;

        // Extract database config
        const { protocol, host, port, user, password, schema } = this.extractDatabaseConfig(databaseURI);

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

        // Set data mapper
        this._dataMapper = new DataMapper(database);
    }

    /**
     * Set response format
     * @param customResponse
     */
    private setResponse(customize?: boolean) {
        this._response = new Response(customize);
    }

    /**
     * Initialize the server and connect to the database
     */
    async initialize() {
        try {
            this._logger.info('Starting Warp Server...');
            
            // Attempt to connect to the database
            await this._dataMapper.initialize();


            // Display startup screen
            this._logger.bare(chalk.yellow(`
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
            this._logger.info('Service started');
        }
        catch(err) {
            this._logger.error(err, err.message);
        }
    }

    /**
     * Get express router
     */
    get router(): Router {
        // If a router has not yet been defined, prepare the router
        if(typeof this._router === 'undefined') {
            // Prepare routers
            const router = Router();
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

/**
 * Export features
 */
export {
    Class,
    Query,
    User,
    Session,
    Function,
    Key,
    WarpServer
};