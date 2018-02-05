// References
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');

// Prepare class
var WarpFunction = {};

// Static methods
_.extend(WarpFunction, {
    create: function(def) {                
        // Prepare subclass
        var FunctionSubclass =  {
            _action: def.action,
            name: def.name,
            run: function(req, res) {
                this._action(req, res);
            }
        };
        return FunctionSubclass;
    }
});

module.exports = WarpFunction;