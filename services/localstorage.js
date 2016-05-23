// References
var Promise = require('promise');
var moment = require('moment-timezone');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var localstorage = function(path) {
    this.path = path || '';
};

// Instance methods
_.extend(localstorage.prototype, {
    _getKey: function(filename) {
        var now = moment().tz('UTC').format('YYYYMMDDHHmmss');
        var randomizer = (Math.random() * 1e32).toString(36);
        var dirname = path.dirname(filename);
        var baseFilename = now + '-' + randomizer  + '-' + path.basename(filename);
        return path.join(dirname, baseFilename);
    },
    _getUrl: function(key) {
        return key;
    },
    setKeyFormat: function(keyFormat) {
        this._getKey = keyFormat;
        return this;
    },
    setUrlFormat: function(urlFormat) {
        this._getUrl = urlFormat;
        return this;
    },
    upload: function(filename, file) {
        return new Promise(function(resolve, reject) {
            try
            {
                var key = this._getKey(filename);
                var url = this._getUrl(key);
                var filepath = path.join(this.path, key);
                fs.writeFileSync(filepath, file);
                return resolve({ key: key, url: url });
            }
            catch(ex)
            {
                console.error('[Warp Localstorage] Could not save file to path', ex.message, ex.stack);
                var error = new Error('Could not save file to path');
                return reject(error);
            }
        }.bind(this));
    },
    destroy: function(key) {
        return new Promise(function(resolve, reject) {
            try
            {
                var now = moment().tz('UTC');
                var filepath = path.join(this.path, key);
                fs.unlinkSync(filepath);
                resolve({ key: key, deleted_at: now.format() });
            }
            catch(ex)
            {                
                console.error('[Warp Localstorage] Could not destroy file', ex.message, ex.stack);
                var error = new Error('Could not destroy file');
                return reject(error);
            }
        }.bind(this));
    }
});

module.exports = localstorage;