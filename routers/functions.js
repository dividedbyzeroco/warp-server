var _ = require('underscore');
var moment = require('moment-timezone');

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
        var sessionToken = req.sessionToken;
        var query = new this.Query.View(this._getSessionModel().className);
        
        // Check session
        query.where({ 
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
        .then(user => {
            var name = req.params.name;
            var request = {
                keys: new KeyMap(req.body),
                client: req.client,
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
                    var error = new Error(message);
                    error.code = 101;
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