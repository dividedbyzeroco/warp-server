// References
var path = require('path');
var Promise = require('promise');
var multer = require('multer');
var WarpError = require('./error');
var localstorage = require('./services/localstorage');

// Prepare log header
function logHeader() {
    return '[Warp Storage ' + moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss') + ']';
}

// Prepare class
var StorageFactory = {
    extend: function(config) {
        // Set default values
        var storagePath = ''; // Default to base path
        var storageOptions = {}; // Default to empty object
        var storageAdapter = localstorage; // Default to use localstorage
        var maxFileSize = 1024 * 1024 * 10; // Default to 10mb
        
        // If config is set
        if(config)
        {
            // Set max file size, storage path, and storage adapter
            maxFileSize =  config.maxFileSize || maxFileSize;
            storagePath = config.path || storagePath;
            storageOptions = config.options || storageOptions;
            storageAdapter = config.adapter || storageAdapter;
        }
        
        // Class definition
        var Storage = {
            _storageAdapter: new storageAdapter(storagePath, storageOptions),
            _maxFileSize: maxFileSize,
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
                            console.error(logHeader(), 'Could not save file', err.message, err.stack);
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
            setUrlFormat: function(urlFormat) {
                if(typeof keyFormat === 'function')
                    throw new WarpError(WarpError.Code.MissingConfiguration, 'UrlFormat must be a function');
                
                return this._storageAdapter.setUrlFormat(urlFormat);
            },
            getUrl: function(key, next) {
                this._storageAdapter._getUrl(key, next);
            },
            upload: function(options) {
                if(!options || !options.filename || !options.file)
                    throw new WarpError(WarpError.Code.MissingConfiguration, 'Filename and file parameters are required');
                
                return new Promise(function(resolve, reject) {
                    this._storageAdapter.upload(options.filename, options.file, resolve, reject);
                }.bind(this));
            },
            destroy: function(key) {
                if(!key)
                    throw new WarpError(WarpError.Code.MissingConfiguration, 'Key is required');
                    
                return this._storageAdapter.destroy(key);
            }
            
        };
        
        // Return class
        return Storage;
    }
};

module.exports = StorageFactory;