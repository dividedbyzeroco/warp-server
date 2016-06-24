// References
var Promise = require('promise');
var _ = require('underscore');
var WarpError = require('../error');

/******************************************************/

// Factory
var QueryFactory = {
    extend: function(database) {
        // Class constructor
        var ViewQuery = function(className) {
            this.className = className;
            this._joins = [];
            this._keys = {};
            this._constraints = {};
            this._order = [];
            this._limit;
            this._skip;
        };

        // Instance methods
        _.extend(ViewQuery.prototype, {
            _operands: {
                'eq': '=',
                'neq': '<>',
                'gt': '>',
                'gte': '>=',
                'lt': '<',
                'lte': '<='
            },
            _parseKey: function(className, value, label) {
                className = className || this.className;
                return '`' + className + '`.`' + value + '` AS `' + label + '`'
            },
            _parseConstraint: function(key, type, value) {
                var rawKey = key;
                key = key.indexOf('.') >= 0? '`' + key.split('.').join('`.`') + '`' : 
                    '`' + this.className + '`.`' + key + '`';
                    
                switch(type)
                {
                    case 'eq':
                    case 'neq':
                    case 'gt':
                    case 'gte':
                    case 'lt':
                    case 'lte':
                        rawKey = key;
                        value = ViewQuery._getDatabase().escape(value);
                    case '_eq':
                    case '_neq':
                    case '_gt':
                    case '_gte':
                    case '_lt':
                    case '_lte':
                        type = type.replace('_', '');
                    return [rawKey, this._operands[type], value].join(' ');

                    case 'str':
                        value = value + '%';
                        value = ViewQuery._getDatabase().escape(value);
                    return [key, 'LIKE', value].join(' ');
                    case 'end':
                        value = '%' + value;
                        value = ViewQuery._getDatabase().escape(value);
                    return [key, 'LIKE', value].join(' ');
                    case 'has':
                        value = '%' + value + '%';
                        value = ViewQuery._getDatabase().escape(value);
                    return [key, 'LIKE', value].join(' ');
                            
                    case 'ex':
                    return [key, value? 'IS NOT NULL' : 'IS NULL'].join(' ');
                    
                    case 'in':
                    var options = value.map(function(option) {
                        return  ViewQuery._getDatabase().escape(option); 
                    }.bind(this)).join(',');
                    var list = ['(', options , ')'].join(' ');
                    return [key, 'IN', list].join(' ');
                    
                    case 'nin':
                    var options = value.map(function(option) {
                        return  ViewQuery._getDatabase().escape(option); 
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
                    var value = typeof details === 'object'? details.field : details;
                    return this._parseKey(className, value, key);
                }.bind(this));
                var select = 'SELECT ' + (keys.length? keys.join(', ') : '*');        
                
                // Get from
                var from = 'FROM ' + this.className;
                
                // Get joins
                var joins = [];
                if(this._joins.length > 0)
                {
                    for(var index in this._joins)
                    {
                        var join = this._joins[index];
                        var className = join.className;
                        var joinString = 'LEFT OUTER JOIN `' + className + '` AS `' + join.alias + '` ON (';
                        if(typeof join.where === 'object')
                        {
                            var constraints = Object.keys(join.where).map(function(key) {
                                var details = join.where[key];
                                
                                return Object.keys(details).map(function(type) {
                                    var value = details[type];
                                    return this._parseConstraint(key, type, value);
                                }.bind(this)).join(' AND ');
                            }.bind(this));
                            joinString += constraints.length? constraints.join(' AND ') : '';
                        }
                        else
                        {
                            var via = '`' + 
                                (join.via.indexOf('.') >= 0? 
                                    join.via.split('.').join('`.`') : 
                                    this.className + '`.`' + join.via) + 
                                '`';
                            
                            joinString +=  via + ' = `' + className + '`.`' + join.to + '`';
                        }

                        joins.push(joinString + ')');
                    }
                }
                joins = joins.join(' ');
                
                // Get where
                var constraints = Object.keys(this._constraints).map(function(key) {
                    var details = this._constraints[key];
                                
                    return Object.keys(details).map(function(type) {
                        var value = details[type];
                        return this._parseConstraint(key, type, value);
                    }.bind(this)).join(' AND ');
                }.bind(this));
                var where = constraints.length? ('WHERE ' + constraints.join(' AND ')) : '';
                
                // Get order
                var sort = this._order.map(function(item) {
                    var key = Object.keys(item)[0];
                    var direction = item[key];
                    return this._parseOrder(key, direction)
                }.bind(this));
                var order = sort.length? 'ORDER BY ' + sort.join(', ') : '';
                
                // Get options
                var limit = this._limit? ('LIMIT ' + (this._skip || 0) + ', ' + this._limit) :
                    this._skip? ('LIMIT ' + this._skip + ', 0') :
                    '';
                
                // Return query string
                var query = [select, from, joins, where, order, limit, ';'].join(' ').replace(/\s{2,}/g, ' ');
                return query;
            },
            _execute: function(config) {
                var config = config || {};
                return ViewQuery._getDatabase().query(this._getFindViewQuery());
            },
            _addChain: function(query, next, fail) {        
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
            join: function(join) {
                this._joins.push({
                    className: join.className,
                    alias: join.alias,
                    via: join.via,
                    to: join.to,
                    where: join.where
                });
            },
            joins: function(joins) {
                for(var index in joins)
                {
                    var join = joins[index];
                    this.join(join || {});
                }
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

        // Static Methods
        _.extend(ViewQuery, {
            _database: database,
            _getDatabase: function() {
                return this._database;
            }
        });
        
        return ViewQuery;
    }
};

// Export module
module.exports = QueryFactory;
