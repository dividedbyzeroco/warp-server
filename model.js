// References
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');

/******************************************************/

// Class constructor
var Model = function(className) {
    this.className = className;
};

// Instance methods
_.extend(Model.prototype, {
});

// Static methods
_.extend(Model, {
    _internalKeys: {
        id: 'id',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
    },
    _subclasses: {},
    _user: null,
    _session: null,
    initialize: function(security, query) {
        this._security = security;
        this._viewQuery = query.View;
        this._actionQuery = query.Action;
        return this;
    },
    getInternalKeys: function() {
        return Object.keys(this._internalKeys).map(function(key) {
            return this._internalKeys[key];
        }.bind(this));
    },
    getViewQuery: function(className) {
        return this._viewQuery.build(className);
    },
    getActionQuery: function(className, id) {
        return this._actionQuery.build(className, id);
    },    
    register: function(subclass) {
        this._subclasses[subclass.className] = subclass;
    },
    registerUser: function(subclass) {
        this._user = subclass;
    },
    registerSession: function(subclass) {
        this._session = subclass;
    },
    getByClassName: function(className) {
        if(className == 'user') throw new WarpError(WarpError.Code.ForbiddenOperation, 'User operations must use appropriate route');
        var model = this._subclasses[className];
        if(!model) throw new WarpError(WarpError.Code.ModelNotFound, 'Model not found');
        return this._subclasses[className];
    },
    getUser: function() {
        return this._user;
    },
    getSession: function() {
        return this._session;
    },
    create: function(config) {
        var self = this;
                
        // Prepare subclass
        var ModelSubclass = {
            className: config.className,
            source: config.source || config.className,
            keys: config.keys || {},
            validate: config.validate || {},
            parse: config.parse || {},
            format: config.format || {},
            beforeSave: config.beforeSave,
            afterSave: config.afterSave
        };
        
        // Prepare parsers and formatters based on validations
        for(var key in ModelSubclass.validate)
        {
            if(ModelSubclass.validate[key] == Model.Validation.Pointer)
            {
                if(!ModelSubclass.parse[key])
                    ModelSubclass.parse[key] = Model.Parser.Pointer;
                if(!ModelSubclass.format[key])
                    ModelSubclass.format[key] = Model.Formatter.Pointer;
            }
        }
        
        // Prepare formatters for timestamps
        self.getInternalKeys().forEach(function(key) {
            if(key !== 'id')
            ModelSubclass.format[key] = Model.Formatter.Date;   
        });
        
        _.extend(ModelSubclass, {
            getViewableKeys: function(keys) {
                // Get keys selected
                var keysSelected = keys? Object.keys(keys) : [];
                
                // Get keys available
                var keysAliased = {};
                var keysAvailable = this.keys.viewable.map(function(key) {
                    // Initialize alias and source
                    var alias = key;
                    var source = key;
                    
                    // Check if key is object
                    if(typeof key === 'object')
                    {
                        alias = Object.keys(key)[0];
                        source = key[alias];
                    }
                    
                    // Return alias
                    keysAliased[alias] = source;
                    return alias;
                });
                
                // Get keys to view
                var keysToView = keysSelected.length > 0 ? _.intersection(keysSelected, keysAvailable) : keysAvailable;
                
                // Make sure id and timestamps are included; But remove the deleted_at key
                keysToView = _.union(keysToView, self.getInternalKeys());
                keysToView = _.difference(keysToView, [self._internalKeys.deletedAt]);
                                
                // Prepare keys viewable
                var keysViewable = {};
                keysToView.forEach(function(key) {
                    var alias = key;
                    var source = keysAliased[key] || key; 
                    keysViewable[alias] = source;
                });
                
                // Return keys viewable
                return keysViewable;
            },
            getActionableKeys: function(keys, options) {
                // Get keys selected
                var keysSelected = keys? Object.keys(keys) : [];
                options = options || {};
                
                // Get keys available
                var keysAliased = {};
                var keysAvailable = this.keys.actionable.map(function(key) {
                    // Initialize alias and source
                    var alias = key;
                    var source = key;
                    
                    // Check if key is object
                    if(typeof key === 'object')
                    {
                        alias = Object.keys(key)[0];
                        source = key[alias];
                    }
                    
                    // Return alias
                    keysAliased[alias] = source;
                    return alias;
                });
                                
                // Get keys to act on
                var keysToActOn = _.intersection(keysSelected, keysAvailable);
                                
                // Make sure id and timestamps are not edited by the user
                keysToActOn = _.difference(keysToActOn, self.getInternalKeys());

                // Prepare keys actionable
                var keysActionable = {};
                keysToActOn.forEach(function(key) {
                    var value = keys[key];
                    
                    // Validate value
                    if(typeof this.validate[key] === 'function')
                    {
                        var isValid = this.validate[key](value, key);
                        if(typeof isValid === 'string')
                            throw new WarpError(WarpError.Code.InvalidObjectKey,isValid);
                    }
                        
                    // Parse value
                    var parsedValue = typeof this.parse[key] === 'function'? 
                        this.parse[key](value) :
                        value;
                    
                    // Add actionable key
                    var source = keysAliased[key] || key;
                    keysActionable[source] = parsedValue;
                }.bind(this));
                
                // Change timestamps
                var now = options.now;
                keysActionable[self._internalKeys.updatedAt] = now.format('YYYY-MM-DD HH:mm:ss');
                if(options.isNew) keysActionable[self._internalKeys.createdAt] = now.format('YYYY-MM-DD HH:mm:ss');
                if(options.isDestroyed) keysActionable[self._internalKeys.deletedAt] = now.format('YYYY-MM-DD HH:mm:ss');
                
                if(typeof this.beforeSave === 'function') keysActionable = this.beforeSave(keysActionable, options);
                
                return keysActionable;
            },
            find: function(options) {
                var query = self.getViewQuery(this.source);
                query.select(this.getViewableKeys(options.select));
                                
                // Get where options; Remove deleted objects
                var where = options.where? options.where : {};
                where.deleted_at = {
                    'ex': false
                };
                query.where(where);
                
                if(options.limit) query.limit(options.limit);
                if(options.skip) query.skip(options.skip);
                if(options.sort) query.sort(options.sort);
            
                return query.find(function(result) {
                    var items = result;
                    for(var index in result)
                    {
                        var item = result[index];
                        for(var key in item)
                        {
                            if(typeof this.format[key] === 'function')
                                items[index][key] = this.format[key](item[key]);
                        }
                    }
                    return items;
                }.bind(this));
            },
            first: function(id) {
                var query = self.getViewQuery(this.source);
                query.select(this.getViewableKeys());
                var where = {};
                where[self._internalKeys.id] = { 'eq': id };
                query.where(where);
                
                return query.first(function(result) {
                    var item = result;
                    for(var key in result)
                    {
                        if(this.format[key])
                            item[key] = this.format[key](result[key]);
                    }
                    return item;
                }.bind(this));                
            },
            create: function(options) {
                var query = self.getActionQuery(this.source);
                var now = moment().tz('UTC');
                var keys = this.getActionableKeys(options.fields, { isNew: true, now: now });
                return query.fields(keys).create().then(function(result) {
                    keys.id = result.id;
                    keys.created_at = now.format();
                    keys.updated_at = now.format();
                    if(typeof this.afterSave === 'function') this.afterSave(keys);
                    return keys;
                }.bind(this));
            },
            update: function(options) {
                var query = self.getActionQuery(this.source, options.id);
                var now = moment().tz('UTC');
                var keys = this.getActionableKeys(options.fields, { now: now });
                return query.fields(keys).update().then(function() {
                    keys.id = options.id;
                    keys.updated_at = now.format();
                    if(typeof this.afterSave === 'function') this.afterSave(keys);
                    return keys;
                }.bind(this));
                
            },
            destroy: function(options) {
                var query = self.getActionQuery(this.source, options.id);
                var now = moment().tz('UTC');
                query.fields(this.getActionableKeys({}, { isDestroyed: true, now: now }));
                // Only do soft deletes
                return query.update().then(function(result) {
                    result.id = options.id;
                    result.updated_at = now.format();
                    result.deleted_at = now.format();
                    if(typeof this.afterSave === 'function') this.afterSave(result);
                    return result;
                }.bind(this));
            }
        });
        
        return ModelSubclass;
    }
});

Model.Validation = {
    FixedString: function(min, max) {
        return function(value, key) {
            if(value.length < min || max && value.length > max) 
                return key + ' must be greater than or equal to ' + min + ' characters' 
                + (max? ', and less than or equal to ' + max + ' characters' : '');
            return;
        };
    },
    Password: function(min, max) {
        return function(value, key) {
            if(value.length < min || max && value.length > max) 
                return key + ' must be greater than or equal to ' + min + ' characters' 
                + (max? ', and less than or equal to ' + max + ' characters' : '');
            return;
        };
    },
    Email: function(value, key) {
        if(!value.toString().match(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.([a-z]){2,})?$/i))
            return key + ' is not a valid email address';
        return;
    },
    Integer: function(value, key) {
        if(isNaN(value) || parseInt(value) != value) return key + ' must be an integer';
        return;
    },
    PositiveInteger: function(value, key) {
        if(isNaN(value) || value < 0 || parseInt(value) != value) return key + ' must be a positive integer';
        return;
    },
    Float: function(value, key) {
        if(isNaN(value) || parseFloat(value) != value) return key + ' must be a float value';
        return;
    },
    Pointer: function(value, key) {
        try
        {
            var pointer = (typeof value === 'object') ? value : JSON.parse(value);
            if(typeof pointer !== 'object' || pointer.type !== 'Pointer') return key + ' must be a pointer';
        }
        catch(ex)
        {
            return key + ' must be a pointer';
        }
        
        return;
    }
};

Model.Parser = {
    NoSpaces: function(value) {
        return value.split(' ').join('');
    },
    Password: function(value) {
        return Model._security.hash(value, 8);
    },
    Integer: function(value) {
        return parseInt(value, 10);
    },
    Float: function(decimals) {
        return function(value) {
            return parseFloat(value).toFixed(decimals);
        }
    },
    Date: function(value) {
        return moment(value).tz('UTC').format('YYYY-MM-DD HH:mm:ss');
    },
    Pointer: function(pointer) {
        return typeof pointer === 'object' ? pointer.id : JSON.parse(pointer).id;
    }
};

Model.Formatter = {
    Date: function(value) {
        return moment(value).tz('UTC').format();
    },
    Pointer: function(value) {
        var pointer = {
            type: 'Pointer',
            id: value
        };
        
        return pointer;
    }
};

Model.PreSave = {
    Session: function(keys, options) {
        // Check if the item is new
        if(options.isNew)
        {
            // Generate session token
            keys.session_token = (keys.user_id * 1024 * 1024).toString(36) + '+' + (Math.random()*1e32).toString(36) + parseInt(keys.user_id*1e32).toString(36);
            keys.deleted_at = moment().tz('UTC').add(30, 'days').format('YYYY-MM-DD HH:mm:ss');
        }
        
        return keys;
    }
};

// Export modules
module.exports = Model;