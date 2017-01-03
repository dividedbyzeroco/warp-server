// References
var mysql = require('mysql');
var moment = require('moment-timezone');
var Promise = require('promise');
var _ = require('underscore');
var WarpError = require('../error');

// Prepare log header
function logHeader() {
    return '[Warp Database ' + moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss') + ']';
}

// Class constructor
var Database = function(config, onConnect) {
    var host = config.host || 'localhost';
    var port = config.port || 3306;
    var user = config.user;
    var password = config.password;
    var database = config.default;
    var timeout = config.timeout || 30000;
    // Temporarily removed charset because of migration issues
    //var charset = config.charset || 'utf8mb4_unicode_ci'; // Allows emojis
    this._id = config.id || this._id;
    
    this._pool = mysql.createPool({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        acquireTimeout: timeout
        //charset: charset
    });

    this._pool.on('connection', onConnect);
};

// Static methods
_.extend(Database.prototype, {
    _pool: null,
    _id: 'id',
    _connect: function() {
        return new Promise(function(resolve, reject) {
            this._pool.getConnection(function(err, connection) {
                if(err)
                {
                    console.error(logHeader(), 'Could not connect to the database', err.message, err.stack);
                    var error = new WarpError(WarpError.Code.QueryError, 'Could not connect to the database');
                    return reject(error);
                }
                else
                    return resolve(connection);
            }.bind(this));
        }.bind(this));
    },
    getIdKey: function() {
        return this._id;
    },
    query: function(query) {
        return new Promise(function(resolve, reject) {
            this._connect().then(function(connection) {
                connection.query(query, function(err, rows) {
                    connection.release();
                    if(err)
                    {
                        console.error(logHeader(), 'Query Error', query, err.message, err.stack);
                        var error = new WarpError(WarpError.Code.QueryError, 'Invalid query request');
                        return reject(error);
                    }
                    else
                    {
                        // Prepare result
                        var result = {};
                        // Check query items
                        if(rows instanceof Array)
                            result = rows;
                        else
                        {
                            // Check action items
                            if(rows.insertId) result.id = rows.insertId;
                            if(rows.affectedRows) result.rows = rows.affectedRows;
                        }
                        
                        // Return result
                        return resolve(result);
                    }
                });
            });
        }.bind(this));
    },
    escape: function(value) {
        return this._pool.escape(value);
    }
});

module.exports = Database;