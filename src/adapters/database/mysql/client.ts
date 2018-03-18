import mysql from 'mysql';
import Error from '../../../utils/error';
import { Increment, SetJson, AppendJson } from '../../../classes/specials';
import { DatabaseConfigType, DatabaseResult } from '../../../types/database';

export default class DatabaseClient {

    /**
     * Private propreties
     */
    _config: DatabaseConfigType = {
        host: 'localhost',
        user: '',
        password: ''
    };
    _pool: mysql.Pool;

    /**
     * Constructor
     * @param {Object} config 
     */
    constructor({ 
        host, 
        port, 
        user, 
        password, 
        schema, 
        timeout, 
        charset, 
        keepConnections 
    }: DatabaseConfigType) {
        // Prepare parameters
        this._config.host = host;
        this._config.port = port;
        this._config.user = user;
        this._config.password = password;
        this._config.schema = schema;
        this._config.keepConnections = keepConnections;
        this._config.charset = charset;
        this._config.timeout = timeout;
    }

    get pool(): mysql.Pool {
        return this._pool;
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
            const path = value.isNew? '$' : this.pool.escape(value.path);
            const val = typeof value.value === 'object'? `CAST(${JSON.stringify(value.value)} AS JSON)` : this.pool.escape(value.value);
            const escaped = `JSON_SET(${key}, ${path}, ${val})`;
            return escaped;
        }
        else if(value instanceof AppendJson) {
            const key = value.isNew? 'JSON_ARRAY()' : `IFNULL(${this.escapeKey(value.key)}, JSON_ARRAY())`;
            const path = value.isNew? '$' : this.pool.escape(value.path);
            const val = typeof value.value === 'object'? `CAST(${JSON.stringify(value.value)} AS JSON)` : this.pool.escape(value.value);
            return `JSON_ARRAY_APPEND(${key}, ${path}, ${val})`;
        }
        else return this.pool.escape(value);
    }

    escapeKey(value: string, useRaw: boolean = false) {
        if(useRaw) {
            value = this.pool.escapeId(value.replace('.', '$'));
            return value.replace('$', '.');
        }
        return this.pool.escapeId(value, useRaw);
    }

    async initialize(): Promise<void> {
        // If pool is already initialized, skip
        if(this.pool) return;
        
        // Prepare pool
        this._pool = mysql.createPool({
            host: this._config.host,
            port: this._config.port,
            user: this._config.user,
            password: this._config.password,
            database: this._config.schema,
            acquireTimeout: this._config.timeout,
            charset: this._config.charset
        });

        // Test connection
        const result = await this.query('SELECT 1+1 AS result');
        try {
            const rows = result['rows'] || [{ result: undefined }];
            if(rows[0]['result'] === 2) return;
            else throw new Error(Error.Code.InternalServerError, 'Could not connect to the pool');
        }
        catch(err) {
            throw new Error(Error.Code.InternalServerError, 'Could not connect to the pool');
        }
    }

    async _connect(): Promise<mysql.PoolConnection> {
        // Create a promise connect method
        const onConnect = new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
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

    async query(queryString: string): Promise<DatabaseResult> {
        // Create promise query method
        const connection = await this._connect();
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
            if(this._config.keepConnections) connection.release();
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