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
            name: def.name,
            action: def.action
        };
        return FunctionSubclass;
    }
});

module.exports = WarpFunction;