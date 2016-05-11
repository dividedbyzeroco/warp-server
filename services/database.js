// References
var mysql = require('mysql');
var Promise = require('promise');
var _ = require('underscore');

/******************************************************/

// Class constructor
var Database = {};

// Static methods
_.extend(Database, {
    _pool: null,
    _id: 'id',
    _connect: function() {
        return new Promise(function(resolve ,reject) {
            this._pool.getConnection(function(err, connection) {
                if(err)
                    return reject(err);
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
                        return reject(err);
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
    },
    initialize: function(config) {
        var host = config.host || 'localhost';
        var port = config.port || 3306;
        var user = config.user;
        var password = config.password;
        var database = config.default;
        var timeout = config.timeout || 30000;
        this._id = config.id || this._id;
        
        this._pool = mysql.createPool({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database,
            acquireTimeout: timeout
        });
        
        return this;
    }
});

module.exports = Database;