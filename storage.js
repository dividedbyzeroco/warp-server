// References
var path = require('path');
var Promise = require('promise');
var moment = require('moment-timezone');
var _ = require('underscore');
var multer = require('multer');
var WarpError = require('./error');
var localstorage = require('./services/localstorage');

// Prepare class
var Storage = {};

// Static methods
_.extend(Storage, {
    _storageAdapter: null,
    _maxFileSize: 1024 * 1024 * 10, // Default to 10mb
    initialize: function(config, query) {
        this._viewQuery = query.View;
        this._actionQuery = query.Action;
        this._schemaQuery = query.Schema;
        var storagePath = '';
        
        if(config.storage)
        {
            this._maxFileSize =  config.storage.maxFileSize || this._maxFileSize;
            storagePath = config.storage.path || storagePath;
        }
        
        // Use localstorage as the default storage adapter
        if(!this._storageAdapter) this.setStorageAdapter(new localstorage(storagePath));
    },
    setStorageAdapter: function(storageAdapter) {
        this._storageAdapter = storageAdapter;
        return this;
    },
    load: function(req, res) {
        var options = { 
            limits: {
                fileSize: this._maxFileSize 
            }
        };
        var loader = multer(options).single('file');
        
        return new Promise(function(resolve, reject) {
            loader(req, res, function(err) {
                if(err)
                {                        
                    console.error('[Warp Storage] Could not save file', err.message, err.stack);
                    var error = new WarpError(WarpError.Code.InternalServerError, 'Could not parse the file');
                    return reject(error);
                }
                
                resolve();                
            });
        });
    },
    setKeyFormat: function(keyFormat) {
        if(typeof keyFormat === 'function')
            throw new WarpError(WarpError.Code.MissingConfiguration, 'KeyFormat must be a function');
        
        return this._storageAdapter.setKeyFormat(keyFormat);
    },
    upload: function(options) {
        if(!options || !options.filename || !options.file)
            throw new WarpError(WarpError.Code.MissingConfiguration, 'Filename and file parameters are required');
        
        return this._storageAdapter.upload(options.filename, options.file);
    },
    destroy: function(key) {
        if(!key)
            throw new WarpError(WarpError.Code.MissingConfiguration, 'Key is required');
            
        return this._storageAdapter.destroy(key);
    }
});

module.exports = Storage;