// References
var Promise = require('promise');
var _ = require('underscore');
var WarpError = require('../error');

/******************************************************/


// Factory
var QueryFactory = {
    DataTypes: {
        String: 'string',
        Email: 'email',
        Password: 'password',
        Text: 'text',
        Acl: 'acl',
        DateTime: 'datetime',
        Float: 'float',
        Money: 'money',
        GeoPoint: 'geopoint',
        Integer: 'integer',
        Pointer: 'pointer'
    },
    Addons: {
        Primary: 'primary',
        Increment: 'increment',
        Unique: 'unique',
        Required: 'required'
    },
    extend: function(database) {
        // Class constructor
        var SchemaQuery = function(className, id) {
            this.className = className;
            this.id = id;
            this._keys = {};
            this._unique = [];
        };

        // Instance methods
        _.extend(SchemaQuery.prototype, {
            _actions: {        
                'add': 'ADD',
                'modify': 'MODIFY',
                'drop': 'DROP COLUMN',
                'rename': 'CHANGE COLUMN'
            },
            _getAction: function(key) {
                var action = this._keys[key].action;
                return this._actions[action];
            },
            _getDataType: function(type, length) {
                switch(type)
                {            
                    case QueryFactory.DataTypes.Pointer:
                    case QueryFactory.DataTypes.Integer:
                        dataType = 'INT';
                        length = length? length : '11';
                        break;
                    
                    case QueryFactory.DataTypes.GeoPoint:
                        length = length? length : '12, 8';
                    case QueryFactory.DataTypes.Money:
                    case QueryFactory.DataTypes.Float:
                        dataType = 'FLOAT';
                        length = length? length : '14, 2';
                        break;
                        
                    case QueryFactory.DataTypes.DateTime:
                        dataType = 'DATETIME';
                        length = null;
                        break;
                        
                    case QueryFactory.DataTypes.Acl:
                    case QueryFactory.DataTypes.Text:
                        dataType = 'TEXT';
                        break;
                    
                    case QueryFactory.DataTypes.Password:
                        length = length? length : '250';
                    case QueryFactory.DataTypes.Email:
                        length = length? length : '60';
                    case QueryFactory.DataTypes.String:
                    default:
                        dataType = 'VARCHAR';
                        length = length? length : '30';
                        break;    
                }
                
                return dataType + (length? '(' + length + ')' : '');
            },
            _getAddons: function(key, details) {
                var nullable = true;
                var listAddons = details.map(function(addon) {
                    switch(addon)
                    {                          
                        case QueryFactory.Addons.Primary:
                            nullable = false;
                            return 'PRIMARY KEY';
                            
                        case QueryFactory.Addons.Increment:
                            return 'AUTO_INCREMENT';
                            
                        case QueryFactory.Addons.Unique:
                            nullable = false;
                            this._unique.push(key);
                            return '';
                            
                        case QueryFactory.Addons.Required:
                            nullable = false;
                        default:
                            return '';
                    }
                }.bind(this));
                
                if(!nullable)
                    listAddons.push('NOT NULL');
                
                return listAddons.join(' ');
            },
            _getAttributes: function(key) {
                // Get props
                var props = this._keys[key];
                
                // Check if props exist
                if (!props)
                    return '';
                else if(typeof props === 'string')
                    return this._getDataType(props);
                
                var type = props.type;
                var length = props.size || null;
                var addons = props.addons || [];
                
                // Check if type is set
                if(!type) return '';
                            
                // Determine data type and length
                var dataType = this._getDataType(type, length);                    
                
                // Determine addons
                var details = this._getAddons(key, addons);
                
                // Return attributes
                return [dataType, details].join(' ');
            },
            _getCreateAttributes: function(key) {
                return ['`' + key + '`', this._getAttributes(key)].join(' ');
            },
            _getAlterAttributes: function(key) {
                var action = this._getAction(key);
                var field = '`' + key + '`';
                var attributes = null;
                
                switch(action)
                {
                    case this._actions['rename']:
                        attributes = '`' + this._keys[key].to + '`' + this._getAttributes(key);
                        break;
                        
                    case this._actions['drop']:
                        attributes = '';
                        break;
                    
                    case this._actions['modify']:
                    case this._actions['add']:
                    default:
                        attributes = this._getAttributes(key);
                        break;
                }
                
                return [action, field, attributes].join(' ');
            },
            _getCreateSchemaQuery: function(config) { 
                // Get create
                var once = config && config.once? 'IF NOT EXISTS ' : '';
                var create = 'CREATE TABLE ' + once + '`' + this.className + '`';
                
                // Get columns and data types
                this._unique = [];
                var columns = Object.keys(this._keys).map(function(key) {
                    return this._getCreateAttributes(key);
                }.bind(this));
                
                // Get unique
                if(this._unique.length > 0)
                {
                    var uniqueKeys = this._unique.map(function(key) {
                        return '`' + key + '`';
                    }).join(', ');
                    var unique = 'UNIQUE (' + uniqueKeys + ')';
                    columns.push(unique);
                }        
                
                // Join columns
                columns = '(' + columns.join(', ') + ')';
                
                // Return SchemaQuery string
                var command = [create, columns, ';'].join(' ').replace(/\s{2,}/g, ' ');
                return command;
            },
            _getAlterSchemaQuery: function() {        
                // Get alter
                var alter = 'ALTER TABLE `' + this.className + '`';
                
                // Get values
                var listColumns = Object.keys(this._keys).map(function(key) {
                    return this._getAlterAttributes(key); 
                }.bind(this));
                var columns = listColumns.join(', ');
                
                // Return SchemaQuery string
                var command = [alter, columns, ';'].join(' ').replace(/\s{2,}/g, ' ');
                return command;
            },
            _getDropSchemaQuery: function(config) {
                // Get delete
                var once = config && config.once? 'IF EXISTS ' : '';
                var deletion = 'DROP TABLE ' + once + '`' + this.className + '`';
                
                // Return SchemaQuery string
                var command = [deletion, ';'].join(' ').replace(/\s{2,}/g, ' ');
                return command;
            },
            _execute: function(command) {
                var config = config || {};
                return SchemaQuery._getDatabase().query(command);
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
            fields: function(fields) {
                this._keys = fields;
                return this;
            },
            create: function(next, fail) {
                var query = this._execute(this._getCreateSchemaQuery());
                        
                // Modify the query chain       
                return this._addChain(query, next, fail);
            },
            createOnce: function(next, fail) {
                var query = this._execute(this._getCreateSchemaQuery({ once: true }));
                        
                // Modify the query chain       
                return this._addChain(query, next, fail);
            },
            alter: function(next, fail) {
                var query = this._execute(this._getAlterSchemaQuery());
                
                // Modify the query chain       
                return this._addChain(query, next, fail);
            },
            alterOnce: function(next, fail) {
                // Added the Once alias for the Migration class
                var query = this._execute(this._getAlterSchemaQuery());
                
                // Modify the query chain
                return this._addChain(query, next, fail);
            },
            drop: function(next, fail) {
                var query = this._execute(this._getDropSchemaQuery());
                
                // Modify the query chain       
                return this._addChain(query, next, fail);
            },
            dropOnce: function(next, fail) {
                var query = this._execute(this._getDropSchemaQuery({ once: true }));
                
                // Modify the query chain       
                return this._addChain(query, next, fail);
            }
        });

        // Static methods
        _.extend(SchemaQuery, {
            _database: database,
            _getDatabase: function() {
                return this._database;
            }
        });
        
        return SchemaQuery;
    }
};

// Export module
module.exports = QueryFactory;