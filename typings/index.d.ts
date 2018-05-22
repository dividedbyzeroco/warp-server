import express from 'express';
import Class from './classes/class';
import User from './classes/user';
import Function from './classes/function';
import Session from './classes/session';
import Key from './classes/key';
import { ServerConfigType } from './types/server';
import { SecurityConfigType } from './types/security';
import { IDatabaseAdapter } from './types/database';
import { ThrottlingConfigType } from './types/throttling';
import { ClassMapType, ClassFunctionsType } from './types/class';
import { AuthMapType, AuthFunctionsType, AuthOptionsType } from './types/auth';
import { FunctionMethodsType, FunctionMapType } from './types/functions';
import { ResponseFunctionsType } from './types/response';
import { ILogger } from './types/logger';
import ClassController from './controllers/class';
import UserController from './controllers/user';
import SessionController from './controllers/session';
import FunctionController from './controllers/function';
/**
 * @class WarpServer
 * @description WarpServer definition
 */
export default class WarpServer {
    _log: ILogger;
    _security: SecurityConfigType;
    _database: IDatabaseAdapter;
    _throttling: ThrottlingConfigType;
    _classes: ClassMapType;
    _auth: AuthMapType;
    _functions: FunctionMapType;
    _router: express.Router;
    _customResponse: boolean;
    _supportLegacy: boolean;
    _classController: ClassController;
    _userController: UserController;
    _sessionController: SessionController;
    _functionController: FunctionController;
    /**
     * Constructor
     * @param {Object} config
     */
    constructor({apiKey, masterKey, passwordSalt, sessionDuration, databaseURI, keepConnections, charset, timeout, requestLimit, customResponse, supportLegacy}: ServerConfigType);
    /**
     * API Key
     */
    readonly apiKey: string;
    /**
     * Master Key
     */
    readonly masterKey: string;
    readonly hasDatabase: boolean;
    readonly throttling: ThrottlingConfigType;
    /**
     * Class operations
     */
    readonly classes: ClassFunctionsType;
    /**
     * Authentication operations
     */
    readonly auth: AuthFunctionsType;
    /**
     * Function operations
     */
    readonly functions: FunctionMethodsType;
    /**
     * Response format
     */
    readonly response: ResponseFunctionsType;
    /**
     * Set security configuration
     * @param {Object} config
     */
    private _setSecurity({apiKey, masterKey, passwordSalt, sessionDuration});
    /**
     * Extract database configuration from URI
     * @param {Object} config
     */
    private _extractDatabaseConfig(databaseURI);
    /**
     * Set database configuration
     * @param {Object} config
     */
    private _setDatabase({databaseURI, keepConnections, charset, timeout});
    /**
     * Set throttling configuration
     * @param {Object} config
     */
    private _setThrottling({limit, unit});
    /**
     * Initialize the server and connect to the database
     */
    initialize(): Promise<void>;
    /**
     * Authenticate a sessionToken, username, email, or password
     * @param {AuthOptionsType} options
     */
    authenticate({sessionToken, username, email, password}: AuthOptionsType): Promise<User | undefined>;
    createSessionToken(user: User): string;
    getRevocationDate(): string | undefined;
    parseSubqueries(where: {
        [name: string]: {
            [name: string]: any;
        };
    }): {
        [name: string]: {
            [name: string]: any;
        };
    };
    /**
     * Get express router
     */
    readonly router: express.Router;
}
export { Class, User, Session, Function, Key, WarpServer };
