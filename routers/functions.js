var _ = require('underscore');

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
        var name = req.params.name;    
        var request = {
            keys: new KeyMap(req.body)
        };
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
    },
    apply: function(context, router) {
        router.post('/functions/:name', this.run.bind(context));
        return router;
    }
};