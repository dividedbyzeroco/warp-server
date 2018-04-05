import express from 'express';
import Model from '../classes/model';
import User, { UserClass } from '../classes/user';
import Function from '../classes/function';
import Session from '../classes/session';
import Key from '../classes/key';
import { ServerConfigType } from './server';
import { SecurityConfigType } from './security';
import { IDatabaseAdapter } from './database';
import { ThrottlingConfigType } from './throttling';
import { ModelMapType, ModelFunctionsType } from './model';
import { AuthMapType, AuthFunctionsType, AuthOptionsType } from './auth';
import { FunctionMethodsType, FunctionMapType } from './functions';
import { ResponseFunctionsType } from './response';
import { ILogger } from './logger';
import ClassController from '../controllers/class';
import UserController from '../controllers/user';
import SessionController from '../controllers/session';
import FunctionController from '../controllers/function';
/**
 * @class WarpServer
 * @description WarpServer definition
 */
export interface IWarpServer {
    _log: ILogger;
    _security: SecurityConfigType;
    _database: IDatabaseAdapter;
    _throttling: ThrottlingConfigType;
    _models: ModelMapType;
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
     * Model operations
     */
    readonly models: ModelFunctionsType;
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
     * Get express router
     */
    readonly router: express.Router;
    /**
     * Initialize the server and connect to the database
     */
    initialize(): Promise<void>;
    /**
     * Authenticate a sessionToken, username, email, or password
     * @param {AuthOptionsType} options
     */
    authenticate({sessionToken, username, email, password}: AuthOptionsType): Promise<UserClass | undefined>;
    createSessionToken(user: UserClass): string;
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
}

export declare const IWarpServer: {
    new(options: ServerConfigType): IWarpServer;
}
