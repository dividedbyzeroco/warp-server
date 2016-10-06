// References
var WarpError = require('../error');
var cors = require('cors');

module.exports = {
    enableCors: cors(),
    requireAPIKey: function(apiKey) {
        return function (req, res, next) {
            var key = req.get('X-Warp-API-Key');
            
            if(!key || key !== apiKey)
            {
                var error = new WarpError(WarpError.Code.InvalidAPIKey, 'Invalid API Key');
                next(error);
            }
            else
                next();
        };
    },
    requireMasterKey: function(masterKey) {
        return function (req, res, next) {
            var key = req.get('X-Warp-Master-Key');
            
            if(!key || key !== masterKey)
            {
                var error = new WarpError(WarpError.Code.ForbiddenOperation, 'Forbidden Master Operation');
                next(error);
            }
            else
                next();
        };
    },
    sessionToken: function(req, res, next) {
        req.sessionToken = req.get('X-Warp-Session-Token');
        next();
    },
    client: function(req, res, next) {
        req.client = req.get('X-Warp-Client');
        next();
    },
    sdkVersion: function(req, res, next) {
        req.sdkVersion = req.get('X-Warp-Client-Version');
        next();
    },
    appVersion: function(req, res, next) {
        req.appVersion = req.get('X-App-Version');
        next();
    }
};