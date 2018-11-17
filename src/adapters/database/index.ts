import { IDatabaseAdapter, URIConfig, DatabaseConfig } from '../../types/database';
import MySQLDatabaseAdapter from './mysql';
import Error from '../../utils/error';

export default class Database {

    public static Protocols = Object.freeze({
        mysql: MySQLDatabaseAdapter,
    });

    /**
     * Static use
     * @param {String} protocol
     */
    public static use(protocol: string, config: DatabaseConfig): IDatabaseAdapter {
        // Get database protocol
        const database = this.Protocols[protocol];

        // Check if database exists
        if (typeof database === 'undefined')
            throw new Error(Error.Code.MissingConfiguration, `Database \`${protocol}\` is not supported`);
        else
            return new database(config);
    }
}