import mysql from 'mysql';
import parseUrl from 'parse-url';
import enforce from 'enforce-js';
import Error from '../../../utils/error';
import { DatabaseWrite, DatabaseRead } from '../../../utils/constants';
import { ILogger } from '../../../types/logger';
import { DatabaseConfig, ConnectionCollection, DatabaseAction } from '../../../types/database';
import chalk from 'chalk';
import { ClassId } from '../../../types/class';

export interface DatabaseResult {
    id: ClassId;
    rows: object[];
}

export default class DatabaseClient {

    /**
     * Private propreties
     */
    private connectionConfigs: ConnectionCollection = { write: [], read: [] };
    private poolCluster: mysql.PoolCluster;
    private logger: ILogger;
    private persistent: boolean;

    /**
     * Constructor
     * @param {Object} config
     */
    constructor({ uris, persistent, logger }: DatabaseConfig) {
        // Get connection configs
        for (const uriConfig of uris) {
            // Check if action is write
            if (uriConfig.action === DatabaseWrite) {
                this.connectionConfigs.write.push(this.extractConfig(uriConfig.uri));
            } else if (uriConfig.action === DatabaseRead) {
                this.connectionConfigs.read.push(this.extractConfig(uriConfig.uri));
            } else throw new Error(Error.Code.ForbiddenOperation, `Database action must either be 'write' or 'read'`);
        }

        // Set connection settings
        this.persistent = persistent;
        this.logger = logger;
    }

    /**
     * Extract database configuration from URI
     * @param {Object} config
     */
    private extractConfig(uri: string) {
        const parsedURI = parseUrl(uri);
        const identity = parsedURI.user.split(':');

        // Get params
        const params = parsedURI.query;

        const config = {
            protocol: parsedURI.protocol,
            host: parsedURI.resource,
            port: parsedURI.port,
            user: decodeURIComponent(identity[0]),
            password: decodeURIComponent(identity[1]),
            database: parsedURI.pathname.slice(1),
            ...params,
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

    public escape(value: any) {
        // Escape keys
        return mysql.escape(value);
    }

    public escapeKey(value: string, useRaw: boolean = false) {
        if (useRaw) {
            value = mysql.escapeId(value.replace('.', '$'));
            return value.replace('$', '.');
        }
        return mysql.escapeId(value, useRaw);
    }

    public async initialize(): Promise<void> {
        // If pool is already initialized, skip
        if (this.poolCluster) return;

        // Prepare pool cluster
        this.poolCluster = mysql.createPoolCluster();

        // Loop through write connections
        let index = 0;
        for (const writeConfig of this.connectionConfigs.write) {
            this.poolCluster.add(`${DatabaseWrite.toUpperCase()}${++index}`, writeConfig);
        }

        // Loop through read connections
        index = 0;
        for (const readConfig of this.connectionConfigs.read) {
            this.poolCluster.add(`${DatabaseRead.toUpperCase()}${++index}`, readConfig);
        }

        // Test connection
        const result = await this.query('SELECT 1+1 AS result', DatabaseRead);
        try {
            const rows = result['rows'] || [{ result: undefined }];
            if (rows[0]['result'] === 2) return;
            else throw new Error(Error.Code.InternalServerError, 'Could not connect to the pool');
        } catch (err) {
            throw new Error(Error.Code.InternalServerError, 'Could not connect to the pool');
        }
    }

    private async connect(action: DatabaseAction = DatabaseWrite): Promise<mysql.PoolConnection> {
        // Create a promise connect method
        const onConnect: Promise<mysql.PoolConnection> = new Promise((resolve, reject) => {
            this.poolCluster.getConnection(`${action.toUpperCase()}*`, (err, connection) => {
                if (err) return reject(err);
                resolve(connection);
            });
        });

        try {
            // Await on the connection
            return await onConnect;
        } catch (err) {
            // Throw errors for disconnections
            throw new Error(Error.Code.InternalServerError, `Could not connect to the database: ${err.message}`);
        }
    }

    public async query(queryString: string, action: DatabaseAction): Promise<DatabaseResult> {
        // Create promise query method
        const connection = await this.connect(action);
        const onQuery = new Promise((resolve, reject) => {
            // Display query
            this.logger.info(chalk.green(queryString));

            // Run the query
            connection.query(queryString, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        try {
            // Await row results
            const rows = await onQuery;

            // Release or destroy the connection
            if (this.persistent) connection.release();
            else connection.destroy();

            // Prepare result
            let result;
            if (rows instanceof Array) result = { rows };
            else result = { id: rows['insertId'] };

            return result;
        } catch (err) {
            throw new Error(Error.Code.DatabaseError, `Invalid query request: ${err.message}, ${queryString}`);
        }
    }
}