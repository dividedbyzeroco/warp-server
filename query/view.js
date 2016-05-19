// References
var Promise = require('promise');
var _ = require('underscore');
var WarpError = require('../error');

/******************************************************/

// Class constructor
var ViewQuery = function(className) {
    this.className = className;
    this._keys = {};
    this._constraints = {};
    this._order = [];
    this._limit;
    this._skip;
};

// Instance methods
_.extend(ViewQuery.prototype, {
    _parseKey: function(className, value, label) {
        className = className || this.className;
        return '`' + className + '`.`' + value + '` AS `' + label + '`'
    },
    _parseConstraint: function(key, type, value) {
        switch(type)
        {
            case 'eq':
            case 'neq':
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
            var operands = {
                'eq': '=',
                'neq': '<>',
                'gt': '>',
                'gte': '>=',
                'lt': '<',
                'lte': '<='
            }
            return [key, operands[type], ViewQuery.getDatabase().escape(value)].join(' ');
            
            case 'ex':
            return [key, value? 'IS NOT NULL' : 'IS NULL'].join(' ');
            
            case 'in':
            var options = value.map(function(option) {
                return  ViewQuery.getDatabase().escape(option); 
            }.bind(this)).join(',');
            var list = ['(', options , ')'].join(' ');
            return [key, 'IN', list].join(' ');
            
            case 'nin':
            var options = value.map(function(option) {
                return  ViewQuery.getDatabase().escape(option); 
            }.bind(this)).join(',');
            var list = ['(', options , ')'].join(' ');
            return [key, 'NOT IN', list].join(' ');
        }
    },
    _parseOrder: function(key, direction) {
        return key + (direction > 0? ' ASC' : ' DESC');
    },
    _getFindViewQuery: function() {        
        // Get select
        var keys = Object.keys(this._keys).map(function(key) {
            var details = this._keys[key];
            var className = typeof details === 'object'? details.className : null;
            var value = typeof details === 'object'? details.value : details;
            return this._parseKey(className, value, key);
        }.bind(this));
        var select = 'SELECT ' + (keys.length? keys.join(', ') : '*');        
        
        // Get from
        var from = 'FROM ' + this.className;
        
        // Get where
        var constraints = Object.keys(this._constraints).map(function(key) {
            var details = this._constraints[key];
                        
            return Object.keys(details).map(function(type) {
                var value = details[type];
                return this._parseConstraint(key, type, value)
            }.bind(this)).join(' AND ');
        }.bind(this));
        var where = constraints.length? ('WHERE ' + constraints.join(' AND ')) : '';
        
        // Get order
        var sort = Object.keys(this._order).map(function(direction, key) {
            return this._parseOrder(key, direction)
        }.bind(this));
        var order = sort.length? 'ORDER BY ' + sort.join(', ') : '';
        
        // Get options
        var limit = this._limit? ('LIMIT ' + (this._skip || 0) + ', ' + this._limit) :
            this._skip? ('LIMIT ' + this._skip + ', 0') :
            '';
        
        // Return query string
        var query = [select, from, where, order, limit, ';'].join(' ').replace(/\s{2,}/g, ' ');
        return query;
    },
    _execute: function(config) {
        var config = config || {};
        return ViewQuery.getDatabase().query(this._getFindViewQuery());
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
    select: function(select) {
        this._keys = select;
        return this;
    },
    where: function(constraints) {
        this._constraints = constraints;
        return this;
    },
    sort: function(sort) {
        this._order = sort;
        return this;
    },
    limit: function(limit) {
        this._limit = limit;
        return this;
    },
    skip: function(skip) {
        this._skip = skip;
        return this;
    },
    find: function(next, fail) {
        // Retrieve query
        var query = this._execute();
                        
        // Modify the query chain       
        return this._addChain(query, next, fail);
    },
    first: function(next, fail) {
        // Limit query to only one result
        this.limit(1);
        
        // Retrieve query
        var query = this._execute()
        .then(function(result) {
            return result[0];    
        });        
        
        // Modify the query chain       
        return this._addChain(query, next, fail);
    }
});

// Static methods
_.extend(ViewQuery, {
    initialize: function(database) {
        this._database = database;
        return this;
    },
    getDatabase: function() {
        return this._database;
    },
    build: function(className) {
        return new this(className);
    }
});

// Export module
module.exports = ViewQuery;
