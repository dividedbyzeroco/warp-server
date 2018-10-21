import mysql from 'mysql';
import parseUrl from 'parse-url';
import enforce from 'enforce-js';
import Error from '../../../utils/error';
import { Increment, SetJson, AppendJson } from '../../../classes/specials';
import { DatabaseResult, DatabaseConfig, ConnectionCollection, DatabaseAction } from '../../../types/database';
import { DatabaseWrite, DatabaseRead } from '../../../utils/constants';

export default class DatabaseClient {

    /**
     * Private propreties
     */
    _connectionConfigs: ConnectionCollection = { write: [], read: [] };
    _poolCluster: mysql.PoolCluster;
    _persistent: boolean;
    _charset: string;
    _timeout: number;

    /**
     * Constructor
     * @param {Object} config 
     */
    constructor({ uris, persistent, charset, timeout }: DatabaseConfig) {
        // Get connection configs
        for(const uriConfig of uris) {
            // Check if action is write
            if(uriConfig.action === DatabaseWrite) {
                this._connectionConfigs.write.push(this.extractConfig(uriConfig.uri));
            }
            // Check if action is read
            else if(uriConfig.action === DatabaseRead) {
                this._connectionConfigs.read.push(this.extractConfig(uriConfig.uri));
            }
            else throw new Error(Error.Code.ForbiddenOperation, `Database action must either be 'write' or 'read'`);
        }

        // Set connection settings
        this._persistent = persistent;
        this._charset = charset;
        this._timeout = timeout;

    }

    /**
     * Extract database configuration from URI
     * @param {Object} config
     */
    private extractConfig(uri: string) {
        const parsedURI = parseUrl(uri);
        const identity = parsedURI.user.split(':');

        const config = {
            protocol: parsedURI.protocol,
            host: parsedURI.resource,
            port: parsedURI.port,
            user: identity[0],
            password: identity[1],
            database: parsedURI.pathname.slice(1)
        };

        // Enforce
        enforce`${{ protocol: config.protocol }} as a string`;
        enforce`${{ host: config.host }} as a string`;
        enforce`${{ port: config.port }} as a number`;
        enforce`${{ user: config.user }} as a string`;
        enforce`${{ password: config.password }} as a string`;
        enforce`${{ database: config.database }} as a string`;

        return config;
    }

    get poolCluster(): mysql.PoolCluster {
        return this._poolCluster;
    }

    escape(value: any) {
        // Handle specials
        if(value instanceof Increment) {
            let escaped = `GREATEST(IFNULL(${this.escapeKey(value.key)}, 0) + (${value.value}), ${value.min})`;
            if(typeof value.max !== 'undefined') escaped = `LEAST(${escaped}, ${value.max})`;
            return escaped;
        }
        else if(value instanceof SetJson) {
            const key = value.isNew? 'JSON_OBJECT()' : `IFNULL(${this.escapeKey(value.key)}, JSON_OBJECT())`;
            const path = value.isNew? '$' : mysql.escape(value.path);
            const val = typeof value.value === 'object'? `CAST(${JSON.stringify(value.value)} AS JSON)` : mysql.escape(value.value);
            const escaped = `JSON_SET(${key}, ${path}, ${val})`;
            return escaped;
        }
        else if(value instanceof AppendJson) {
            const key = value.isNew? 'JSON_ARRAY()' : `IFNULL(${this.escapeKey(value.key)}, JSON_ARRAY())`;
            const path = value.isNew? '$' : mysql.escape(value.path);
            const val = typeof value.value === 'object'? `CAST(${JSON.stringify(value.value)} AS JSON)` : mysql.escape(value.value);
            return `JSON_ARRAY_APPEND(${key}, ${path}, ${val})`;
        }
        else return mysql.escape(value);
    }

    escapeKey(value: string, useRaw: boolean = false) {
        if(useRaw) {
            value = mysql.escapeId(value.replace('.', '$'));
            return value.replace('$', '.');
        }
        return mysql.escapeId(value, useRaw);
    }

    async initialize(): Promise<void> {
        // If pool is already initialized, skip
        if(this.poolCluster) return;
        
        // Prepare pool cluster
        this._poolCluster = mysql.createPoolCluster();

        // Get connection settings
        const { _charset: charset, _timeout: timeout } = this;

        // Loop through write connections
        let index = 0;
        for(const writeConfig of this._connectionConfigs.write) {
            this._poolCluster.add(`${DatabaseWrite.toUpperCase()}${++index}`, { ...writeConfig, charset, timeout });
        }

        // Loop through read connections
        index = 0;
        for(const readConfig of this._connectionConfigs.read) {
            this._poolCluster.add(`${DatabaseRead.toUpperCase()}${++index}`, { ...readConfig, charset, timeout });
        }

        // Test connection
        const result = await this.query('SELECT 1+1 AS result', DatabaseRead);
        try {
            const rows = result['rows'] || [{ result: undefined }];
            if(rows[0]['result'] === 2) return;
            else throw new Error(Error.Code.InternalServerError, 'Could not connect to the pool');
        }
        catch(err) {
            throw new Error(Error.Code.InternalServerError, 'Could not connect to the pool');
        }
    }

    private async connect(action: DatabaseAction = DatabaseWrite): Promise<mysql.PoolConnection> {
        // Create a promise connect method
        const onConnect: Promise<mysql.PoolConnection> = new Promise((resolve, reject) => {
            this.poolCluster.getConnection(`${action.toUpperCase()}*`, (err, connection) => {
                if(err) return reject(err);
                resolve(connection);
            });
        });

        try {
            // Await on the connection
            return await onConnect;
        } catch(err) {
            // Throw errors for disconnections
            throw new Error(Error.Code.InternalServerError, `Could not connect to the database: ${err.message}`);
        }
    }

    async query(queryString: string, action: DatabaseAction): Promise<DatabaseResult> {
        // Create promise query method
        const connection = await this.connect(action);
        const onQuery = new Promise((resolve, reject) => {
            connection.query(queryString, (err, result) => {
                if(err) return reject(err);
                resolve(result);
            });
        });
        
        try {
            // Await row results
            const rows = await onQuery;

            // Release or destroy the connection
            if(this._persistent) connection.release();
            else connection.destroy();

            // Prepare result
            let result;
            if(rows instanceof Array) result = { rows };
            else result = { id: rows['insertId'] };

            return result;
        }
        catch(err) {
            throw new Error(Error.Code.DatabaseError, `Invalid query request: ${err.message}, ${queryString}`);
        }
    }
}