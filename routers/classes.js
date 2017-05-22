var _ = require('underscore');
var middleware = require('./middleware');

module.exports = {
    find: function(req, res, next) {
        var className = req.params.className;
        var options = {
            include: req.query.include? JSON.parse(req.query.include) : [],
            where: req.query.where? JSON.parse(req.query.where) : {},
            sort: req.query.sort? JSON.parse(req.query.sort) : [],
            limit: req.query.limit || 100,
            skip: req.query.skip || 0,
            sessionToken: req.sessionToken
        };
        
        var find = this._getModel(className).find(options);
            
        // View objects
        find.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    first: function(req, res, next) {
        var include = req.query.include? JSON.parse(req.query.include) : [];
        var className = req.params.className;
        var id = parseInt(req.params.id);
        var first = this._getModel(className).first(id, include, req.sessionToken);
        
        // View object
        first.then(function(result) 
        {        
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err) 
        {
            next(err);
        });
    },
    create: function(req, res, next) {
        var className = req.params.className;
        var fields = _.extend({}, req.body);
        var create = this._getModel(className).create({ fields: fields }, { sessionToken: req.sessionToken, client: req.client, sdkVersion: req.sdkVersion, appVersion: req.appVersion });
        // Create object
        create.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });    
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    update: function(req, res, next) {
        var className = req.params.className;
        var params = _.extend({}, req.body);
        var id = parseInt(req.params.id);
        var update = this._getModel(className).update({ id: id, fields: params }, { sessionToken: req.sessionToken, client: req.client, sdkVersion: req.sdkVersion, appVersion: req.appVersion });
        
        // Update object
        update.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    destroy: function(req, res, next) {
        var className = req.params.className;
        var id = parseInt(req.params.id);
        var destroy = this._getModel(className).destroy({ id: id }, { sessionToken: req.sessionToken, client: req.client, sdkVersion: req.sdkVersion, appVersion: req.appVersion });
        
        // Delete object
        destroy.then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    options: function(req, res, next) {
        var className = req.params.className;
        var model = this._getModel(className);
        
        // Get model keys
        var keys = {
            viewable: model._getDefinedKeys('viewable'),
            actionable: model._getDefinedKeys('actionable')
        };

        // Check if pointers exist
        if(model.keys.pointers)
            keys['pointers'] = model.keys.pointers;

        // Return keys
        res.json({ status: 200, message: 'Success', result: keys});
    },
    apply: function(context, router) {
        var masterKeyRequired = middleware.requireMasterKey(context._config.security.masterKey);
        router.get('/classes/:className', this.find.bind(context));
        router.get('/classes/:className/:id', this.first.bind(context));
        router.post('/classes/:className', this.create.bind(context));
        router.put('/classes/:className/:id', this.update.bind(context));
        router.delete('/classes/:className/:id', this.destroy.bind(context));
        router.options('/classes/:className', masterKeyRequired, this.options.bind(context));
        return router;
    }
};