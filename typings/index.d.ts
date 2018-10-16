import express from 'express';
import Class from './classes/class';
import User from './classes/user';
import Function from './classes/function';
import Session from './classes/session';
import Key from './classes/key';
import Scope from './classes/scope';
import Role from './classes/role';
import { ServerConfigType } from './types/server';
import { SecurityConfigType } from './types/security';
import { IDatabaseAdapter } from './types/database';
import { ThrottlingConfigType } from './types/throttling';
import { ClassMapType, ClassFunctionsType } from './types/class';
import { AuthFunctionsType } from './types/auth';
import { FunctionMethodsType, FunctionMapType } from './types/functions';
import { ResponseFunctionsType } from './types/response';
import { ILogger } from './types/logger';
import ClassController from './controllers/class';
import UserController from './controllers/user';
import SessionController from './controllers/session';
import FunctionController from './controllers/function';
import Auth from './classes/auth';
import Client from './classes/client';
import { RoleFunctionsType, RoleMapType } from './types/roles';
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
    _functions: FunctionMapType;
    _roles: RoleMapType;
    _auth: Auth;
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
    constructor({ apiKey, masterKey, databaseURI, keepConnections, charset, timeout, requestLimit, accessExpiry, sessionRevocation, customResponse, supportLegacy }: ServerConfigType);
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
     * Function operations
     */
    readonly functions: FunctionMethodsType;
    /**
     * Role operations
     */
    readonly roles: RoleFunctionsType;
    /**
     * Authentication operations
     */
    readonly auth: AuthFunctionsType;
    /**
     * Response format
     */
    readonly response: ResponseFunctionsType;
    /**
     * Set security configuration
     * @param {Object} config
     */
    private _setSecurity;
    /**
     * Extract database configuration from URI
     * @param {Object} config
     */
    private _extractDatabaseConfig;
    /**
     * Set database configuration
     * @param {Object} config
     */
    private _setDatabase;
    /**
     * Set throttling configuration
     * @param {Object} config
     */
    private _setThrottling;
    /**
     * Initialize the server and connect to the database
     */
    initialize(): Promise<void>;
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
export { Class, User, Session, Client, Function, Key, Scope, Role, WarpServer };
