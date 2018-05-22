import { IDatabaseAdapter, DatabaseConfigType } from '../../types/database';
import MySQLDatabaseAdapter from './mysql';
export default class Database {
    static Protocols: Readonly<{
        'mysql': typeof MySQLDatabaseAdapter;
    }>;
    /**
     * Static use
     * @param {String} protocol
     */
    static use(protocol: string, config: DatabaseConfigType): IDatabaseAdapter;
}
