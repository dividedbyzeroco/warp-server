import 'reflect-metadata';
import { Router } from 'express';
import enforce from 'enforce-js';
import chalk from 'chalk';
import Class from './features/orm/class';
import Query from './features/orm/query';
import User from './features/auth/user';
import Function from './features/functions/function';
import ClassManager from './features/orm/class-manager';
import FunctionManager from './features/functions/function-manager';
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
import { URIConfig } from './types/database';

const { version } = require('./package.json');

/**
 * Initialize validation
 */
Validation.initialize();

/**
 * @class Warp
 * @description Warp definition
 */
export default class Warp {

    private loggerInstance: ILogger;
    private security: SecurityConfigType;
    private classManager: ClassManager;
    private functionManager: FunctionManager;
    private routerInstance: Router;
    private responseInstance: Response;
    private classController: ClassController = new ClassController(this);
    private functionController: FunctionController = new FunctionController(this);

    /**
     * Constructor
     * @param {Object} config
     */
    constructor({
        databaseURI,
        apiKey = '',
        masterKey = '',
        persistent = false,
        customResponse,
        restful,
    }: ServerConfigType) {
        // Set logger
        this.setLogger('console');

        // Set security
        this.setSecurity({ apiKey, masterKey });

        // Set class manager
        this.setClassManager(databaseURI, persistent);

        // Set action mapper
        this.setFunctionManager();

        // Set response format
        this.setResponse(customResponse);

        // Set router
        this.setRouter(restful);
    }

    static get Class() {
        return Class;
    }

    static get User() {
        return User;
    }

    static get Query() {
        return Query;
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
        return this.classManager;
    }

    /**
     * Function operations
     */
    get functions(): FunctionManager {
        return this.functionManager;
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
            function: this.functionController,
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
            masterKey,
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
        if (typeof databaseURI === 'string') {
            uris = [
                { uri: databaseURI, action: 'read' },
                { uri: databaseURI, action: 'write' },
            ];
        } else if (databaseURI instanceof Array) {
            uris = [ ...databaseURI ];
        } else {
            throw new Error(`'databaseURI' must be a string or an array of configs`);
        }

        // Get database protocol
        const protocol = uris[0].uri.split(':')[0];

        // Prepare database
        const database = Database.use(protocol, { uris, persistent, logger: this.logger });

        // Set data mapper
        this.classManager = new ClassManager(database);
    }

    /**
     * Set action mapper configuration
     */
    private setFunctionManager() {
        // Set action mapper
        this.functionManager = new FunctionManager();
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
        if (restful) router.use(classesRouter(this));

        // Set the router instance
        this.routerInstance = router;
    }

    /**
     * Initialize the server and connect to the database
     */
    public async initialize() {
        try {
            this.loggerInstance.info('Starting Warp Server...');

            // Attempt to connect to the database
            await this.classManager.initialize();

            // Display startup screen
            this.loggerInstance.bare(chalk.hex('#E8822F')(`
                MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
                MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
                MMMMMMMNmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
                MMMMMMMMhhmMMMMMMMMMMMMMMMMMMMMMMMNNMMMMMMM
                MMMMMMMMNyshNMMMMMMMMMMMMMMMMMMMMNhMMMMMMMM
                MMMMMMMMMmssshNMMMMMMMMMMMMMMMMMMymMMMMMMMM
                MMMMMMMMMMhsssshNMMMMMMmhNMMMMMMhhMMMMMMMMM
                MMMMMMMMMMMyssssshNMMMMysshNMMMhsmMMMMMMMMM
                MMMMMMMMMMMmssssssshNMdssssshmhshMMMMMMMMMM
                MMMMMMMMMMMMdsssssssNNysssssssssNMMMMMMMMMM
                MMMMMMMMMMMMMyssssshMyssssssssshMMMMMMMMMMM
                MMMMMMMMMMMMMNyssssmdssshNmhsssNMMMMMMMMMMM
                MMMMMMMMMMMMMMdsssyNysymMMMMNddMMMMMMMMMMMM
                MMMMMMMMMMMMMMMhssmhshMMMMMMMMMMMMMMMMMMMMM
                MMMMMMMMMMMMMMMNyymymMMMMMMMMMMMMMMMMMMMMMM
                MMMMMMMMMMMMMMMMmddMMMMMMMMMMMMMMMMMMMMMMMM
                MMMMMMMMMMMMMMMMMNMMMMMMMMMMMMMMMMMMMMMMMMM
                MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM

                           Warp Server ${version}

                +-----------------------------------------+
                |     The server has been initialized     |
                +-----------------------------------------+
            `));
            this.loggerInstance.info('Service started');
        } catch (err) {
            this.loggerInstance.error(err, err.message);
        }
    }
}

/**
 * Export types
 */
export { ClassId, ClassOptions } from './types/class';
export { Request } from './types/request';

/**
 * Export features
 */
export { define } from './features/orm/class';
export { key } from './features/orm/keys/key';
export { hidden } from './features/orm/keys/modifiers/hidden';
export { guarded } from './features/orm/keys/modifiers/guarded';
export { length } from './features/orm/keys/modifiers/length';
export { min } from './features/orm/keys/modifiers/min';
export { max } from './features/orm/keys/modifiers/max';
export { between } from './features/orm/keys/modifiers/between';
export { rounded } from './features/orm/keys/modifiers/rounded';
export { enumerated } from './features/orm/keys/modifiers/enumerated';
export {
    beforeFind,
    beforeFirst,
    beforeGet,
    beforeSave,
    afterSave,
    beforeDestroy,
    afterDestroy,
} from './features/orm/keys/modifiers/triggers';

/**
 * Export features
 */
export {
    Class,
    Query,
    Collection,
    User,
    Function,
    Warp,
    ClassManager,
};