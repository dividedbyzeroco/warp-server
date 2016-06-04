var _ = require('underscore');

module.exports = {
    run: function(req, res, next) {    
        var name = req.params.name;    
        var action = this._getFunction(name);
        var request = {
            keys: req.body
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
        action(request, response);
    },
    apply: function(context, router) {
        router.post('/functions/:name', this.run.bind(context));
        return router;
    }
};