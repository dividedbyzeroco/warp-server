// References
var Promise = require('promise');
var _ = require('underscore');
var WarpError = require('../error');

/******************************************************/

// Class constructor
var ActionQuery = function(className, id) {
    this.className = className;
    this.id = id;
    this._keys = {};
};

// Instance methods
_.extend(ActionQuery.prototype, {
    _getCreateActionQuery: function() { 
        // Get insert into
        var insert = 'INSERT INTO `' + this.className + '`';
        
        // Get columns and values
        var listColumns = [];
        var listValues = [];        
        Object.keys(this._keys).forEach(function(key) {
            listColumns.push(key);
            listValues.push(this._keys[key]);
        }.bind(this));
        var columns = '(`' + listColumns.join('`,`') + '`)';
        var values = 'VALUES (' + listValues.map(function(value) {
            return ActionQuery.getDatabase().escape(value);
        }).join(',') + ')';
        
        // Return ActionQuery string
        var command = [insert, columns, values, ';'].join(' ').replace(/\s{2,}/g, ' ');
        return command;
    },
    _getUpdateActionQuery: function() {        
        // Get update
        var update = 'UPDATE `' + this.className + '`';
        
        // Get values
        var listValues = Object.keys(this._keys).map(function(key) {
            return ['`' + key + '`', '=', ActionQuery.getDatabase().escape(this._keys[key])].join(' '); 
        }.bind(this));
        var values = 'SET ' + listValues.join(', ');
        
        // Get where
        var where = 'WHERE `' + ActionQuery.getIdKey()  + '` = ' + ActionQuery.getDatabase().escape(this.id);
        
        // Return ActionQuery string
        var command = [update, values, where, ';'].join(' ').replace(/\s{2,}/g, ' ');
        return command;
    },
    _getDestroyActionQuery: function() {
        // Get delete
        var deletion = 'DELETE FROM `' + this.className + '`';
        var where = 'WHERE `' + ActionQuery.getIdKey()  + '` = ' + ActionQuery.getDatabase().escape(this.id);
        
        // Return ActionQuery string
        var command = [deletion, where, ';'].join(' ').replace(/\s{2,}/g, ' ');
        return command;
    },
    _getCreateUpdateActionQuery: function(config) {
        // Get insert into
        var insert = 'INSERT INTO `' + this.className + '`';
                
        // Get columns and values
        var listColumns = [];
        var listValues = [];        
        Object.keys(this._keys).forEach(function(key) {
            listColumns.push(key);
            listValues.push(this._keys[key]);
        }.bind(this));
        
        // Add id to the query
        listColumns.unshift('id');
        listValues.unshift(this.id);
        
        var columns = '(`' + listColumns.join('`,`') + '`)';
        var values = 'VALUES (' + listValues.map(function(value) {
            return ActionQuery.getDatabase().escape(value);
        }).join(',') + ')';
        
        // Get update values
        var listUpdateValues = _.difference(Object.keys(this._keys), config.createOnly).map(function(key) {
            return ['`' + key + '`', '=', ActionQuery.getDatabase().escape(this._keys[key])].join(' '); 
        }.bind(this));
        var updateValues = listUpdateValues.join(', ');
        
        // Get duplicate
        var duplicate = 'ON DUPLICATE KEY UPDATE ' + updateValues;
        
        // Return ActionQuery string
        var command = [insert, columns, values, duplicate, ';'].join(' ').replace(/\s{2,}/g, ' ');
        return command;
    },
    _execute: function(command) {
        var config = config || {};
        return ActionQuery.getDatabase().query(command);
    },
    _addChain: function(query, next, fail) {        
        // Ensure a WarpError is returned if it fails 
        query = query.catch(function(err) {
            if(err.name !== 'WarpError')
            {
                console.error('[Warp Query] Invalid query request', err.message, err.stack);
                throw new WarpError(WarpError.Code.QueryError, 'invalid query request');
            }
            else
                throw err;
        });
        
        // Check if next and fail exist
        if(typeof next === 'function')
            query = query.then(next);
        if(typeof fail === 'function')
            query = query.catch(fail);
            
        // Return the modified query
        return query;
    },
    fields: function(fields) {
        this._keys = fields;
        return this;
    },
    create: function(next, fail) {
        var query = this._execute(this._getCreateActionQuery());
        
        // Modify the query chain       
        return this._addChain(query, next, fail);
    },
    update: function(next, fail) {
        var query = this._execute(this._getUpdateActionQuery());
               
        // Modify the query chain       
        return this._addChain(query, next, fail);
    },
    destroy: function(next, fail) {
        var query = this._execute(this._getDestroyActionQuery());
               
        // Modify the query chain       
        return this._addChain(query, next, fail);
    },
    createOrUpdate: function(config, next, fail) {
        var createOnly = config && config.createOnly? config.createOnly : [];
        var query = this._execute(this._getCreateUpdateActionQuery({ createOnly: createOnly }));
        
        // Modify the query chain       
        return this._addChain(query, next, fail);
    }
});

// Static methods
_.extend(ActionQuery, {
    initialize: function(database) {
        this._database = database;
        return this;
    },
    getIdKey: function() {
        return this._database.getIdKey();
    },
    getDatabase: function() {
        return this._database;
    },
    build: function(className, id) {
        return new this(className, id);
    }
});

// Export module
module.exports = ActionQuery;