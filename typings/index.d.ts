import express from 'express';
import Class from './classes/class';
import User from './classes/auth/user';
import Function from './classes/function';
import Session from './classes/auth/session';
import Key from './classes/keys/key';
import Scope from './classes/auth/scope';
import Role from './classes/auth/role';
import Client from './classes/auth/client';
import DataMapper from './classes/data-mapper';
import { ServerConfigType } from './types/server';
import { ResponseFunctionsType } from './types/response';
import { ILogger } from './types/logger';
import ClassController from './controllers/class';
import FunctionController from './controllers/function';
import Response from './utils/response';
/**
 * @class WarpServer
 * @description WarpServer definition
 */
export default class WarpServer {
    private _logger;
    private _security;
    private _dataMapper;
    _router: express.Router;
    _response: Response;
    _supportLegacy: boolean;
    _classController: ClassController;
    _functionController: FunctionController;
    /**
     * Constructor
     * @param {Object} config
     */
    constructor({ apiKey, masterKey, databaseURI, keepConnections, charset, timeout, customResponse, supportLegacy }: ServerConfigType);
    /**
     * API Key
     */
    readonly apiKey: string;
    /**
     * Master Key
     */
    readonly masterKey: string;
    readonly hasDatabase: boolean;
    /**
     * Class operations
     */
    readonly classes: DataMapper;
    /**
     * Logger
     */
    readonly logger: ILogger;
    /**
     * Response format
     */
    readonly response: ResponseFunctionsType;
    /**
     * Set logger
     * @param customResponse
     */
    private setLogger;
    /**
     * Set security configuration
     * @param {Object} config
     */
    private setSecurity;
    /**
     * Extract database configuration from URI
     * @param {Object} config
     */
    private extractDatabaseConfig;
    /**
     * Set data mapper configuration
     * @param {Object} config
     */
    private setDataMapper;
    /**
     * Set response format
     * @param customResponse
     */
    private setResponse;
    /**
     * Initialize the server and connect to the database
     */
    initialize(): Promise<void>;
    /**
     * Get express router
     */
    readonly router: express.Router;
}
export { Class, User, Session, Client, Function, Key, Scope, Role, WarpServer };
