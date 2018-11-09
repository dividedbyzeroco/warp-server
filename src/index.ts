import 'reflect-metadata';
import { Request as ExpressRequest, Router } from 'express';
import enforce from 'enforce-js';
import chalk from 'chalk';
import Class from './features/orm/class'
import Query from './features/orm/query';
import User from './features/auth/user';
import Function from './features/functions/function';
import Key from './features/orm/keys/key';
import ClassManager from './features/orm/class-manager';
import FunctionManager from './features/functions/function-manager';
import { BelongsTo } from './features/orm/pointer';
import Database from './adapters/database';
import Logger from './adapters/logger';
import { ServerConfigType } from './types/server';
import { SecurityConfigType } from './types/security';
import { ResponseFunctionsType } from './types/response';
import { ILogger } from './types/logger';
import middleware from './routes/middleware';
import classesRouter from './routes/classes';
import functionsRouter from './routes/functions';
import ClassController from './controllers/class';
import FunctionController from './controllers/function';
import Collection from './utils/collection';
import Response from './utils/response';
import Validation from './utils/validation';
import { MiddlewareRequest } from './types/request';
import { URIConfig } from './types/database';
import { ClassOptions } from './types/class';
import { Hidden } from './features/orm/keys/modifiers/hidden';
import { Protected } from './features/orm/keys/modifiers/protected';
import {
    BeforeFind,
    BeforeFirst,
    BeforeGet,
    BeforeSave,
    AfterSave,
    BeforeDestroy,
    AfterDestroy
} from './features/orm/keys/modifiers/triggers';

const { version } = require('./package.json');

/**
 * Initialize validation
 */
Validation.initialize();

/**
 * @class WarpServer
 * @description WarpServer definition
 */
export default class WarpServer {
    
    private loggerInstance: ILogger;
    private security: SecurityConfigType;
    private dataMapper: ClassManager;
    private actionMapper: FunctionManager;
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
        customResponse,
        restful
    }: ServerConfigType) {
        // Set logger
        this.setLogger('console');

        // Set security
        this.setSecurity({ apiKey, masterKey });

        // Set class manager
        this.setClassManager(databaseURI, persistent);

        // Set action mapper
        this.setActionMapper();

        // Set response format
        this.setResponse(customResponse);

        // Set router
        this.setRouter(restful);
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

    /**
     * Class operations
     */
    get classes(): ClassManager {
        return this.dataMapper;
    }

    /**
     * Function operations
     */
    get functions(): FunctionManager {
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

    // @deprecated - backwards compatibility
    get _classController() {
        return this.classController;
    }

    // @deprecated - backwards compatibility
    get _functionController() {
        return this.functionController;
    }

    /**
     * Get express router
     */
    get router(): Router {
        // Return the router
        return this.routerInstance;
    }

    /**
     * Set logger
     * @param customResponse
     */
    private setLogger(channel: string) {
        this.loggerInstance = Logger.use(channel, 'Warp Server', process.env.WARP_LOG_LEVEL || 'error');
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
    private setClassManager(databaseURI: string | URIConfig[], persistent: boolean) {
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
        const database = Database.use(protocol, { uris, persistent, logger: this.logger });

        // Set data mapper
        this.dataMapper = new ClassManager(database);
    }
    
    /**
     * Set action mapper configuration
     */
    private setActionMapper() {
        // Set action mapper
        this.actionMapper = new FunctionManager();
    }

    /**
     * Set response format
     * @param customResponse
     */
    private setResponse(customize?: boolean) {
        this.responseInstance = new Response(customize);
    }

    /**
     * Set router
     * @param restful 
     */
    private setRouter(restful: boolean = false) {
        // Prepare routers
        const router = Router();
        router.use(middleware(this));
        router.use(functionsRouter(this));

        // Only use class routers when restful
        if(restful) router.use(classesRouter(this));

        // Set the router instance
        this.routerInstance = router;
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
}

/**
 * Request extended from Express.Request
 */
export type Request<U extends User | undefined> = ExpressRequest & MiddlewareRequest<U>;

/**
 * Class options
 */
export type ClassOptions<U extends User | undefined> = ClassOptions<U>;

/**
 * Export features
 */
export {
    Class,
    Query,
    Collection,
    User,
    Function,
    Key,
    WarpServer,
    ClassManager,
    BelongsTo,
    Hidden,
    Protected,
    BeforeFind,
    BeforeFirst,
    BeforeGet,
    BeforeSave,
    AfterSave,
    BeforeDestroy,
    AfterDestroy
};