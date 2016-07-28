// References
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');
var WarpSecurity = require('./security');

/******************************************************/

// Class constructor
var Model = {};

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
        return Object.keys(Model._internalKeys).map(function(key) {
            return Model._internalKeys[key];
        }.bind(this));
    },  
    create: function(config) {
        var self = this;
                
        // Prepare subclass
        // To-do: Emulate Warp.Object
        var ModelSubclass =  {
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
            
            if(!ModelSubclass.validate[file])
                ModelSubclass.validate[file] = Model.Validation.File;
            if(!ModelSubclass.parse[file])
                ModelSubclass.parse[file] = Model.Parser.File;
            if(!ModelSubclass.format[file])
                ModelSubclass.format[file] = Model.Formatter.File;
        }
        
        // Prepare formatters for timestamps
        self.getInternalKeys().forEach(function(key) {
            if(key !== 'id')
            ModelSubclass.format[key] = Model.Formatter.Date;   
        });
        
        // Extend static methods
        _.extend(ModelSubclass, {
            _getDefinedKeys: function(type) {
                var keysAliased = {};
                var keysAvailable = this.keys[type].map(function(key) {
                    // Initialize alias and source
                    var alias = key;
                    var source = key;
                    
                    // Check if key is a pointer
                    if(this.keys.pointers[key])
                    {
                        var pointer = this.keys.pointers[key];
                        alias = key;
                        if(type === 'viewable')
                            source = {
                                className: key,
                                field: self._internalKeys.id
                            };
                        else if(type === 'actionable')
                            source = pointer.via ||  key + '_id';
                        // Previous code used the foreign_key as reference: pointer.via || pointer.className + '_id' || key + '_id';
                    }
                    
                    // Return alias
                    keysAliased[alias] = source;
                    return alias;
                }.bind(this));
                
                return {
                    available: keysAvailable,
                    aliased: keysAliased
                };
            },
            getJoins: function() {
                // Get keys selected
                var joinAliases = [];
                Object.keys(this.keys.pointers).forEach(function(pointerName) {
                    if(joinAliases.indexOf(pointerName) >= 0) return;
                    joinAliases.push(pointerName);
                });
                
                var joins = [];
                joinAliases.forEach(function(joinAlias) {
                    var pointer = this.keys.pointers[joinAlias];
                    if(!pointer) return;
                    joins.push({
                        className: pointer.className,
                        alias: joinAlias,
                        via: pointer.via,
                        to: Model._internalKeys.id,
                        where: pointer.where
                    });
                }.bind(this));
                
                return joins;
            },
            getViewKeys: function(keys) {
                // Get keys requested
                var keysRequested = keys || [];
                
                // Get keys selected and pointers
                var pointers = {};
                var keysSelected = [];
                keysRequested.forEach(function(key, index) {
                    if(key.indexOf('.') >= 0)
                    {
                        var parts = key.split('.');
                        var pointerName = parts[0];
                        var field = parts[1];
                        if(!this.keys.pointers[pointerName]) return;
                        var pointer = pointers[pointerName] || [];
                        if(pointer.indexOf(field) >= 0) return;
                        pointer.push(field);
                        pointers[pointerName] = pointer;
                    }
                    else
                    {
                        if(keysSelected.indexOf(key)) return;
                        keysSelected.push(key);
                    }
                }.bind(this));
                
                // Get keys defined
                var keysDefined = this._getDefinedKeys('viewable');
                var keysAvailable = keysDefined.available;
                var keysAliased = keysDefined.aliased;
                
                // Get keys to view
                var keysToView = keysSelected.length > 0 ? _.intersection(keysSelected, keysAvailable) : keysAvailable;
                
                // Make sure id and timestamps are included; But remove the deleted_at key
                keysToView = _.union(keysToView, self.getInternalKeys());
                keysToView = _.difference(keysToView, [self._internalKeys.deletedAt]);
                                
                // Prepare keys viewable
                var keysViewable = {};
                keysToView.forEach(function(key) {
                    var alias = key;
                    var field = keysAliased[key] || key;
                    keysViewable[alias] = field;
                });
                
                // Retrieve pointer keys
                for(var className in pointers)
                {
                    var pointer = pointers[className];
                    pointer.forEach(function(key) {
                        keysViewable[className + '.' + key] = {
                            className: className,
                            field: key
                        };
                    });
                }
                
                // Return keys viewable
                return {
                    viewable: keysViewable,
                    pointers: pointers
                };
            },
            getActionKeys: function(keys, options) {
                // Get keys selected
                var keysSelected = keys? Object.keys(keys) : [];
                
                // Get keys defined
                var keysDefined = this._getDefinedKeys('actionable');
                var keysAvailable = keysDefined.available;
                var keysAliased = keysDefined.aliased;
                
                // Get keys to act on
                // Make sure id and timestamps are not edited by the user
                var keysToActOn = _.intersection(keysSelected, keysAvailable);
                keysToActOn = _.difference(keysToActOn, self.getInternalKeys());

                // Prepare keys parsed
                var keysParsed = {};
                keysToActOn.forEach(function(key) {
                    var value = keys[key];
                    
                    // Validate value
                    if(typeof this.validate[key] === 'function')
                    {
                        var isValid = this.validate[key](value, key);
                        if(typeof isValid === 'string')
                            throw new WarpError(WarpError.Code.InvalidObjectKey, isValid);
                    }
                    
                    // Parse value
                    // NOTE: Check if parsed value is a pointer or a file
                    // Only parse the value of pointer or file after `beforeSave`
                    var parsedValue = typeof this.parse[key] === 'function' &&
                        !this.keys.pointers[key] &&
                        !this.keys.files[key] ? 
                        this.parse[key](value) :
                        value;
                    
                    // Add parsed key
                    keysParsed[key] = parsedValue;
                }.bind(this));
                
                // Change timestamps
                var now = options.now;
                keysParsed[self._internalKeys.updatedAt] = now.format('YYYY-MM-DD HH:mm:ss');
                if(options.isNew) 
                    keysParsed[self._internalKeys.createdAt] = now.format('YYYY-MM-DD HH:mm:ss');
                if(options.isDestroyed)
                    keysParsed[self._internalKeys.deletedAt] = now.format('YYYY-MM-DD HH:mm:ss');
                
                // Create basic key map
                var keyMap = new KeyMap(keysParsed);
                        
                // Create a request object
                var request = {
                    keys: keyMap,
                    isNew: options.isNew? true : false,
                    isDestroyed: options.isDestroyed? true : false
                };
                                
                // Check if beforeSave exists
                if(typeof this.beforeSave === 'function') 
                    return new Promise(function(resolve, reject) {
                        
                        // Create response object
                        var response = {
                            success: function() {
                                // Prepare keys actionable
                                var keysActionable = {};
                                
                                // Iterate through each parsed value
                                for(var key in request.keys.copy())
                                {                                
                                    // Get source and value
                                    var source = keysAliased[key] || key;
                                    var value = request.keys.get(key);

                                    // NOTE: Parse the pointers and files here
                                    if(this.keys.pointers[key] || this.keys.files[key]) 
                                        value = this.parse[key](value);
                                    
                                    // Assign actionable keys
                                    keysActionable[source] = value;
                                    
                                    // Get formatted value
                                    var formattedValue = typeof this.format[key] === 'function'?
                                        this.format[key](value, this) :
                                        value;
                                        
                                    // Set formatted value
                                    request.keys.set(key, formattedValue);
                                }
                                
                                resolve({
                                    request: request,
                                    raw: keysActionable
                                });
                            }.bind(this),
                            error: function(message) {
                                reject(new WarpError(WarpError.Code.InvalidObjectKey, message));
                            }
                        };
                        
                        // Run before save
                        this.beforeSave(request, response); 
                    
                    }.bind(this));
                else
                {
                    // Prepare keys actionable
                    var keysActionable = {};
                    
                    // Iterate through each parsed value
                    for(var key in request.keys.copy())
                    {                                
                        // Get source and value
                        var source = keysAliased[key] || key;
                        var value = request.keys.get(key);
                        
                        // NOTE: Parse the pointers and files here
                        if(this.keys.pointers[key] || this.keys.files[key]) 
                            value = this.parse[key](value);
                        
                        // Assign actionable keys
                        keysActionable[source] = value;
                        
                        // Get formatted value
                        var formattedValue = typeof this.format[key] === 'function'? 
                            this.format[key](value, this) :
                            value;
                            
                        // Set formatted value
                        request.keys.set(key, formattedValue);
                    }
                                
                    return Promise.resolve({
                        request: request,
                        raw: keysActionable
                    });
                }
            },
            find: function(options) {
                // Prepare query
                var query = new this._viewQuery(this.source);
                
                // Prepare joins
                var joins = this.getJoins();
                if(joins.length > 0) query.joins(joins);
                
                // Get view keys
                var viewKeys = this.getViewKeys(options.include || []);
                var viewable = viewKeys.viewable;
                var pointers = viewKeys.pointers;
                
                // Prepare select
                query.select(viewable);
                                
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
                        var pointerValues = {};
                        for(var key in viewable)
                        {
                            var details = viewable[key];
                            
                            // Check if the details is a `pointer` object
                            if(details && typeof details === 'object')
                            {
                                if(details.className)
                                {
                                    if(key.indexOf('.') >= 0)
                                    {
                                        var parts = key.split('.');
                                        var pointerName = parts[0];
                                        var fieldName = parts[1]; 
                                        var pointer = pointerValues[pointerName] || {};
                                        pointer[fieldName] = items[index][key];
                                        pointerValues[pointerName] = pointer;
                                        delete items[index][key];
                                    }
                                    else
                                    {
                                        items[index][key] = this.format[key](items[index][key], this);
                                    }
                                }
                            }
                            else
                            {
                                if(typeof this.format[key] === 'function')
                                    items[index][key] = this.format[key](items[index][key], this);
                            }
                        }
                        
                        for(var pointerName in pointerValues)
                        {
                            var pointerAttributes = pointerValues[pointerName];
                            var pointer = items[index][pointerName];
                            if(!pointerAttributes || !pointer) continue;
                            pointer.attributes = pointerAttributes;
                            items[index][pointerName] = pointer;
                        }
                    }
                    return items;
                }.bind(this));
            },
            first: function(id, include) {
                // Create query
                var query = new this._viewQuery(this.source);
                
                // Prepare joins
                var joins = this.getJoins();
                if(joins.length > 0) query.joins(joins);
                
                // Get view keys
                var viewKeys = this.getViewKeys(include || []);
                var viewable = viewKeys.viewable;
                var pointers = viewKeys.pointers;
                
                query.select(viewable);
                
                // Get where options
                var where = {};
                where[self._internalKeys.id] = { 'eq': id };
                query.where(where);
                                
                return query.first(function(result) {
                    var item = result;
                    var pointerValues = {};
                    for(var key in viewable)
                    {
                        var details = viewable[key];
                        
                        // Check if the details is a `pointer` object
                        if(details && typeof details === 'object')
                        {                 
                            if(details.className)
                            {
                                if(key.indexOf('.') >= 0)
                                {
                                    var parts = key.split('.');
                                    var pointerName = parts[0];
                                    var fieldName = parts[1]; 
                                    var pointer = pointerValues[pointerName] || {};
                                    pointer[fieldName] = item[key];
                                    pointerValues[pointerName] = pointer;
                                    delete item[key];
                                }
                                else
                                {
                                    item[key] = this.format[key](item[key], this);
                                }
                            }
                        }
                        else
                        {
                            if(typeof this.format[key] === 'function')
                                item[key] = this.format[key](item[key], this);
                        }
                    }
                    
                    for(var pointerName in pointerValues)
                    {
                        var pointerAttributes = pointerValues[pointerName];
                        var pointer = item[pointerName];
                        if(!pointerAttributes || !pointer) continue;
                        pointer.attributes = pointerAttributes;
                        item[pointerName] = pointer;
                    }
                    return item;
                }.bind(this));                
            },
            create: function(options) {
                var query = new this._actionQuery(this.source);
                var now = moment().tz('UTC');
                var request = null;
                
                // Get actionable keys
                return this.getActionKeys(options.fields, { now: now, isNew: true })
                .then(function(result) {
                    // Set request
                    request = result.request;
                    
                    // Execute action query
                    return query.fields(result.raw).create();
                })
                .then(function(result) {                    
                    // Update key map
                    request.keys.set('id', result.id);
                    
                    // Check afterSave method
                    if(typeof this.afterSave === 'function') this.afterSave(request);
                    
                    // Return a copy of the keys as a raw object
                    // Remove non-viewable items
                    var keys = request.keys.copy();
                    for(var key in keys)
                    {
                        if(this.keys.viewable.indexOf(key) < 0 && !Model._internalKeys[key])
                            delete keys[key];
                    }                    
                    return keys;
                }.bind(this));
            },
            update: function(options) {
                var query = new this._actionQuery(this.source, options.id);
                var now = moment().tz('UTC');
                var request = null;
                
                // Get actionable keys
                return this.getActionKeys(options.fields, { now: now })
                .then(function(result) {
                    // Set request
                    request = result.request;
                    
                    // Execute action query
                    return query.fields(result.raw).update();
                })
                .then(function(result) {
                    // Update key map
                    request.keys.set('id', options.id);
                                        
                    // Check afterSave method
                    if(typeof this.afterSave === 'function') this.afterSave(request);
                    
                    // Return a copy of the keys as a raw object
                    // Remove non-viewable items
                    var keys = request.keys.copy();
                    for(var key in keys)
                    {
                        if(this.keys.viewable.indexOf(key) < 0 && !Model._internalKeys[key])
                            delete keys[key];
                    }                    
                    return keys;
                }.bind(this));                
            },
            destroy: function(options) {
                var query = new this._actionQuery(this.source, options.id);
                var now = moment().tz('UTC');
                var request = null;
                
                // Get actionable keys
                return this.getActionKeys(options.fields, { now: now, isDestroyed: true })
                .then(function(result) {
                    // Set request
                    request = result.request;
                    
                    // Execute action query
                    return query.fields(result.raw).update();
                })
                .then(function(result) {
                    // Update key map
                    request.keys.set('id', options.id);
                    
                    // Check afterSave method
                    if(typeof this.afterSave === 'function') this.afterSave(request);
                    
                    // Return a copy of the keys as a raw object
                    // Remove non-viewable items
                    var keys = request.keys.copy();
                    for(var key in keys)
                    {
                        if(this.keys.viewable.indexOf(key) < 0 && !Model._internalKeys[key])
                            delete keys[key];
                    }                    
                    return keys;
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
        if(value === null) return;
        if(typeof value === 'object')
        {
            if(value.type !== 'Increment')
                return key + ' must be an integer or an increment object';
        }    
        else
        {
            if(isNaN(value) || parseInt(value) != value) return key + ' must be an integer or an increment object';
        }
        return;
    },
    PositiveInteger: function(value, key) {
        if(value === null) return;
        if(isNaN(value) || value < 0 || parseInt(value) != value) return key + ' must be a positive integer';
        return;
    },
    Float: function(value, key) {
        if(value === null) return;
        if(isNaN(value) || parseFloat(value) != value) return key + ' must be a float value';
        return;
    },
    Pointer: function(className) {
        return function(value, key) {
            try
            {
                if(value === null) return;
                var pointer = (value && typeof value === 'object') ? value : JSON.parse(value);
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
            if(value === null) return;
            var file = (value && typeof value === 'object') ? value : JSON.parse(value);
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
        if(value === null) return null;
        if(typeof value === 'object') return { type: 'increment', value: value.value };
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
        if(pointer === null) return null;
        return pointer && typeof pointer === 'object' ? pointer.id : JSON.parse(pointer).id;
    },
    File: function(file) {
        if(file === null) return null;
        return file && typeof file === 'object' ? file.key : JSON.parse(file).key;
    }
};

Model.Formatter = {
    Integer: function(value) {
        if(value === null) return null;
        return parseInt(value, 10);
    },
    Float: function(decimals) {
        return function(value) {
            return parseFloat(value).toFixed(decimals);
        }
    },
    Date: function(value) {
        return moment(value).tz('UTC').format();
    },
    Pointer: function(className) {
        return function(value) {
            if(!value) return null;
            
            var pointer = {
                type: 'Pointer',
                className: className,
                id: value
            };
            
            return pointer;
        }
    },
    File: function(key, context) {
        var url = context._storage.getUrl(key); 
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
            request.keys.set('session_token', (request.keys.get('user') * 1024 * 1024).toString(36) + '+' + (Math.random()*1e32).toString(36) + parseInt(request.keys.get('user')*1e32).toString(36));
            request.keys.set('deleted_at', moment().tz('UTC').add(30, 'days').format('YYYY-MM-DD HH:mm:ss'));
        }
        
        // Return a successful response
        return response.success();
    }
};

// Export modules
module.exports = Model;