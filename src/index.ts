import 'reflect-metadata';
import { Request as ExpressRequest, Router } from 'express';
import enforce from 'enforce-js';
import Class from './features/orm/class'
import Query from './features/orm/query';
import User from './features/auth/user';
import Function from './features/functions/function';
import Key from './features/orm/keys/key';
import DataMapper from './features/orm/data-mapper';
import { BelongsTo } from './features/orm/pointer';
import Database from './adapters/database';
import Logger from './adapters/logger';
import { ServerConfigType } from './types/server';
import { SecurityConfigType } from './types/security';
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
import { MiddlewareRequest } from './types/request';
import { URIConfig } from './types/database';
import ActionMapper from './features/functions/action-mapper';

const { version } = require('./package.json');

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
    
    private loggerInstance: ILogger;
    private security: SecurityConfigType;
    private dataMapper: DataMapper;
    private actionMapper: ActionMapper;
    private routerInstance: Router;
    private responseInstance: Response;
    private classController: ClassController = new ClassController(this);
    private functionController: FunctionController = new FunctionController(this);

    /**
     * Constructor
     * @param {Object} config 
     */
    constructor({ 
        apiKey,
        masterKey,
        databaseURI,
        persistent = false,
        charset = 'utf8mb4_unicode_ci',
        timeout = 30 * 1000,
        customResponse
    }: ServerConfigType) {
        // Set logger
        this.setLogger('console');

        // Set security
        this.setSecurity({ apiKey, masterKey });

        // Set data mapper
        this.setDataMapper(databaseURI, persistent, charset, timeout);

        // Set action mapper
        this.setActionMapper();

        // Set response format
        this.setResponse(customResponse);
    }

    /**
     * API Key
     */
    get apiKey(): string {
        return this.security.apiKey;
    }

    /**
     * Master Key
     */
    get masterKey(): string {
        return this.security.masterKey;
    }

    get hasDatabase(): boolean {
        // Check if database is defined
        return typeof this.dataMapper !== 'undefined';
    }

    /**
     * Class operations
     */
    get classes(): DataMapper {
        return this.dataMapper;
    }

    /**
     * Function operations
     */
    get functions(): ActionMapper {
        return this.actionMapper;
    }

    /**
     * Logger
     */
    get logger(): ILogger {
        return this.loggerInstance;
    }

    /**
     * Response format
     */
    get response(): ResponseFunctionsType {
        return this.responseInstance;
    }
 
    /**
     * Get controllers
     */
    get controllers() {
        return Object.freeze({
            class: this.classController,
            function: this.functionController
        });
    }

    /**
     * Set logger
     * @param customResponse
     */
    private setLogger(channel: string) {
        this.loggerInstance = Logger.use(channel, 'Warp Server', process.env.LOG_LEVEL || 'error');
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
        this.security = { 
            apiKey, 
            masterKey
        };
    }


    /**
     * Set data mapper configuration
     * @param {Object} config
     */
    private setDataMapper(databaseURI: string | URIConfig[], persistent: boolean, charset: string, timeout: number) {
        // Get uris
        let uris: URIConfig[] = [];

        // Check if uri is a string
        if(typeof databaseURI === 'string') {
            uris = [
                { uri: databaseURI, action: 'read' }, 
                { uri: databaseURI, action: 'write' }
            ];
        }
        // Check if uri is an array
        else if(databaseURI instanceof Array) {
            uris = [ ...databaseURI ];
        }
        else {
            throw new Error(`'databaseURI' must be a string or an array of configs`);
        }

        // Get database protocol
        const protocol = uris[0].uri.split(':')[0];

        // Prepare database
        const database = Database.use(protocol, { uris, persistent, charset, timeout });

        // Set data mapper
        this.dataMapper = new DataMapper(database);
    }
    
    /**
     * Set action mapper configuration
     */
    private setActionMapper() {
        // Set action mapper
        this.actionMapper = new ActionMapper();
    }

    /**
     * Set response format
     * @param customResponse
     */
    private setResponse(customize?: boolean) {
        this.responseInstance = new Response(customize);
    }

    /**
     * Initialize the server and connect to the database
     */
    async initialize() {
        try {
            this.loggerInstance.info('Starting Warp Server...');
            
            // Attempt to connect to the database
            await this.dataMapper.initialize();


            // Display startup screen
            this.loggerInstance.bare(chalk.yellow(`
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
                                                                                            
                         Warp Server ${version}

            +-----------------------------------------+
            |     The server has been initialized     |
            +-----------------------------------------+
            `));
            this.loggerInstance.info('Service started');
        }
        catch(err) {
            this.loggerInstance.error(err, err.message);
        }
    }

    /**
     * Get express router
     */
    get router(): Router {
        // If a router has not yet been defined, prepare the router
        if(typeof this.routerInstance === 'undefined') {
            // Prepare routers
            const router = Router();
            router.use(middleware(this));
            router.use(classesRouter(this));
            router.use(usersRouter(this));
            router.use(functionsRouter(this));

            // Set the router value
            this.routerInstance = router;
        }

        // Return the router
        return this.routerInstance;
    }
}

/**
 * Request extended from Express.Request
 */
export type Request<U extends User | undefined> = ExpressRequest & MiddlewareRequest<U>;

/**
 * Export features
 */
export {
    Class,
    Query,
    User,
    Function,
    Key,
    WarpServer,
    DataMapper,
    BelongsTo
};