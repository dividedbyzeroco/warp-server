// @flow
/**
 * References
 */
import type { IDatabaseAdapter, DatabaseConfigType } from '../../types/database';
import MySQLDatabaseAdapter from './mysql';
import Error from '../../utils/error';

export default class Database {

    static Protocols = Object.freeze({
        'mysql': MySQLDatabaseAdapter
    });

    /**
     * Static use
     * @param {String} protocol
     */
    static use(protocol: string, config: DatabaseConfigType): IDatabaseAdapter {
        // Get database protocol
        const database = this.Protocols[protocol];

        // Check if database exists
        if(typeof database === 'undefined')
            throw new Error(Error.Code.MissingConfiguration, `Database \`${protocol}\` is not supported`);
        else
            return new database(config);
    }
}