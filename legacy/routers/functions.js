var _ = require('underscore');
var Promise = require('promise');
var moment = require('moment-timezone');
var WarpError = require('../error');

// Utils classes
var KeyMap = function(keys) {
    this._keys = keys;
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

module.exports = {
    run: function(req, res, next) {
        // Create auth promise
        var authPromise = Promise.resolve();
        var sessionToken = req.sessionToken;

        // Check if session and user models are defined
        if(this._session && this._user)
        {
            var query = new this.Query.View(this._getSessionModel().className);
        
            // Check session
            if(this._auth && typeof this._auth.session == 'function')
                authPromise = authPromise.then(() => {
                    return new Promise((resolve, reject) => {
                        this._auth.session(sessionToken, resolve, reject).bind(this);
                    });
                });
            else
                authPromise = authPromise.then(() => {
                    return query.where({ 
                        'session_token': { 
                            'eq' : sessionToken 
                        }, 
                        'revoked_at': { 
                            'gt': moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss') 
                        } 
                    })
                    .first(result => {
                        if(result)
                        {
                            var userQuery = new this.Warp.Query(this.Warp.User);
                            return userQuery.get(result.user_id);
                        }
                        else return null;
                    })
                });
        }

        authPromise.then(user => {
            var name = req.params.name;
            var request = {
                keys: new KeyMap(req.body),
                client: req.client,
                sessionToken: sessionToken,
                sdkVersion: req.sdkVersion,
                appVersion: req.appVersion
            };
            if(user) request.user = user;
            var response = {
                success: function(result) {
                    res.json({ status: 200, message: 'Success', result: result });
                },
                error: function(message) {
                    if(typeof message == 'object' && message.getMessage) message = message.getMessage();
                    var error = new WarpError(WarpError.Code.FunctionError, message);
                    next(error);
                }
            };
            
            // Run action
            this._getFunction(name).run(request, response);
        })
        .catch(function(error) {
            next(error);
        });
    },
    apply: function(context, router) {
        router.post('/functions/:name', this.run.bind(context));
        return router;
    }
};