// References
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');
var WarpSecurity = require('./security');

/******************************************************/

// Class constructor
var Model = function(className) {
    this.className = className;
};

// Utils classes
var KeyMap = function(keys) {
    this._keys = keys;
    this.set = function(key, value) {
        this._keys[key] = value;
        return this;
    };
    this.get = function(key) {
        return this._keys[key];
    };
    this.each = function(iterator) {
        for(var key in this._keys)
            iterator(this._keys[key]);
    };
    this.copy = function() {
        return _.extend({}, this._keys);
    };
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
    getInternalKeys: function() {
        return Object.keys(this._internalKeys).map(function(key) {
            return this._internalKeys[key];
        }.bind(this));
    },  
    create: function(config) {
        var self = this;
                
        // Prepare subclass
        var ModelSubclass = {
            _viewQuery: null,
            _actionQuery: null,
            className: config.className,
            source: config.source || config.className,
            keys: config.keys || {},
            validate: config.validate || {},
            parse: config.parse || {},
            format: config.format || {},
            beforeSave: config.beforeSave,
            afterSave: config.afterSave
        };
                
        // Set defaults for pointers and files
        ModelSubclass.keys.pointers = ModelSubclass.keys.pointers || {};
        ModelSubclass.keys.files = ModelSubclass.keys.files || [];
        
        // Prepare parsers and formatters for pointers
        for(var key in ModelSubclass.keys.pointers)
        {
            var pointer = ModelSubclass.keys.pointers[key];
            
            if(!ModelSubclass.validate[key])
                ModelSubclass.validate[key] = Model.Validation.Pointer(pointer.className);
            if(!ModelSubclass.parse[key])
                ModelSubclass.parse[key] = Model.Parser.Pointer;
            if(!ModelSubclass.format[key])
                ModelSubclass.format[key] = Model.Formatter.Pointer(pointer.className);
        }
        
        // Prepare parsers and formatters for files
        for(var key in ModelSubclass.keys.files)
        {
            var file = ModelSubclass.keys.files[key];
            
            if(!ModelSubclass.validate[key])
                ModelSubclass.validate[key] = Model.Validation.File;
            if(!ModelSubclass.parse[key])
                ModelSubclass.parse[key] = Model.Parser.File;
            if(!ModelSubclass.format[key])
                ModelSubclass.format[key] = Model.Formatter.File;
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
                    
                    // Check if key is a pointer
                    if(this.keys.pointers[key])
                    {
                        var pointer = this.keys.pointers[key];
                        alias = key;
                        source = pointer.via || pointer.className + '_id' || key + '_id';
                    }
                    
                    // Return alias
                    keysAliased[alias] = source;
                    return alias;
                }.bind(this));
                
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
                    
                    // Check if key is a pointer
                    if(this.keys.pointers[key])
                    {
                        var pointer = this.keys.pointers[key];
                        alias = key;
                        source = pointer.via || pointer.className + '_id' || key + '_id';
                    }
                    
                    // Return alias
                    keysAliased[alias] = source;
                    return alias;
                }.bind(this));
                                
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
                
                // Create basic key map
                var keyMap = new KeyMap(keysActionable);
                                
                // Check if beforeSave exists
                if(typeof this.beforeSave === 'function') 
                    return new Promise(function(resolve, reject) {
                        
                        // Create request object
                        var request = {
                            keys: keyMap,
                            isNew: options.isNew? true : false,
                            isDestroyed: options.isDestroyed? true : false
                        };
                        
                        // Create response object
                        var response = {
                            success: function() {
                                resolve(request);
                            },
                            error: function(message) {
                                reject(new WarpError(WarpError.Code.InvalidObjectKey, message));
                            }
                        };
                        
                        // Run before save
                        this.beforeSave(request, response); 
                    
                    }.bind(this));
                else
                    Promise.resolve(request);
            },
            find: function(options) {
                var query = new this._viewQuery(this.source);
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
                var query = new this._viewQuery(this.source);
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
                var query = new this._actionQuery(this.source);
                var now = moment().tz('UTC');
                var request = null;
                
                // Get actionable keys
                return this.getActionableKeys(options.fields, { now: now, isNew: true })
                .then(function(result) {
                    request = result;
                })
                .then(function() {
                    // Execute action query
                    return query.fields(request.keys.copy()).create();
                })
                .then(function(result) {
                    // Update key map
                    request.keys.set('id', result.id);
                    request.keys.set('created_at', now.format());
                    request.keys.set('updated_at', now.format());
                    
                    // Check afterSave method
                    if(typeof this.afterSave === 'function') this.afterSave(request);
                    
                    // Return a copy of the keys as a raw object
                    return request.keys.copy();
                }.bind(this));
            },
            update: function(options) {
                var query = new this._actionQuery(this.source, options.id);
                var now = moment().tz('UTC');
                var request = null;
                
                // Get actionable keys
                return this.getActionableKeys(options.fields, { now: now })
                .then(function(result) {
                    request = result;
                })
                .then(function() {
                    // Execute action query
                    return query.fields(request.keys.copy()).update();
                })
                .then(function(result) {
                    // Update key map
                    request.keys.set('id', options.id);
                    request.keys.set('updated_at', now.format());
                    
                    // Check afterSave method
                    if(typeof this.afterSave === 'function') this.afterSave(request);
                    
                    // Return a copy of the keys as a raw object
                    return request.keys.copy();
                }.bind(this));                
            },
            destroy: function(options) {
                var query = new this._actionQuery(this.source, options.id);
                var now = moment().tz('UTC');
                var request = null;
                
                // Get actionable keys
                return this.getActionableKeys(options.fields, { now: now, isDestroyed: true })
                .then(function(result) {
                    request = result;
                })
                .then(function() {
                    // Execute action query
                    return query.fields(request.keys.copy()).update();
                })
                .then(function(result) {
                    // Update key map
                    request.keys.set('id', options.id);
                    request.keys.set('updated_at', now.format());
                    request.keys.set('deleted_at', now.format());
                    
                    // Check afterSave method
                    if(typeof this.afterSave === 'function') this.afterSave(request);
                    
                    // Return a copy of the keys as a raw object
                    return request.keys.copy();
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
    Pointer: function(className) {
        return function(value, key) {
            try
            {
                var pointer = (typeof value === 'object') ? value : JSON.parse(value);
                if(typeof pointer !== 'object' || pointer.type !== 'Pointer' || pointer.className !== className) return key + ' must be a pointer to `' + className + '`';
            }
            catch(ex)
            {
                return key + ' must be a pointer to `' + className + '`';
            }
            
            return;
        };
    },
    File: function(value, key) {
        try
        {
            var file = (typeof value === 'object') ? value : JSON.parse(value);
            if(typeof file !== 'object' || file.type !== 'File') return key + ' must be a Warp File';
        }
        catch(ex)
        {
            return key + ' must be a Warp File';
        }
        
        return;
    }
};

Model.Parser = {
    NoSpaces: function(value) {
        return value.split(' ').join('');
    },
    Password: function(value) {
        return WarpSecurity.hash(value, 8);
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
    },
    File: function(file) {
        return typeof file === 'object' ? file.key : JSON.parse(file).key;
    }
};

Model.Formatter = {
    Date: function(value) {
        return moment(value).tz('UTC').format();
    },
    Pointer: function(className) {
        return function(value) {
            var pointer = {
                type: 'Pointer',
                className: className,
                id: value
            };
            
            return pointer;
        }
    },
    File: function(key) {
        var url = Model._storage.getUrl(key); 
        var file = {
            type: 'File',
            key: key,
            url: url
        };
        
        return file;
    }
};

Model.PreSave = {
    Session: function(request, response) {
        // Check if the item is new
        if(request.isNew)
        {
            // Generate session token
            request.keys.set('session_token', (keys.user_id * 1024 * 1024).toString(36) + '+' + (Math.random()*1e32).toString(36) + parseInt(keys.user_id*1e32).toString(36));
            request.keys.set('deleted_at', moment().tz('UTC').add(30, 'days').format('YYYY-MM-DD HH:mm:ss'));
        }
        
        // Return a successful response
        return response.success();
    }
};

// Export modules
module.exports = Model;