import mysql from 'mysql';
import { DatabaseConfigType, DatabaseResult } from '../../../types/database';
export default class DatabaseClient {
    /**
     * Private propreties
     */
    _config: DatabaseConfigType;
    _pool: mysql.Pool;
    /**
     * Constructor
     * @param {Object} config
     */
    constructor({ host, port, user, password, schema, timeout, charset, keepConnections }: DatabaseConfigType);
    readonly pool: mysql.Pool;
    escape(value: any): string;
    escapeKey(value: string, useRaw?: boolean): string;
    initialize(): Promise<void>;
    _connect(): Promise<mysql.PoolConnection>;
    query(queryString: string): Promise<DatabaseResult>;
}
