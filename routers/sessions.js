var _ = require('underscore');
var security = require('../services/security');

module.exports = {
    find: function(req, res, next) {
        var options = {
            select: this.Model.getSession().getViewableKeys(req.query.select || {}),
            where: req.query.where? JSON.parse(req.query.where) : {},
            sort: req.query.order? JSON.parse(req.query.order) : [],
            limit: req.query.limit || 100,
            skip: req.query.skip || 0
        };
        
        var query = new this.Query.View(this.Model.getSession().className);
                    
        // View objects
        query.select(options.select)
        .where(options.where)
        .limit(options.limit)
        .skip(options.skip)
        .find(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    first: function(req, res, next) {
        var id = parseInt(req.params.id);
        var first = this.Model.getSession().first(id);
        
        // View object
        first.then(function(result) {        
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err) {
            next(err);
        });
    },
    create: function(req, res, next) {
        var fields = _.extend({}, req.body);
        var create = this.Model.getSession().create({ fields: fields });
        
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
        var params = _.extend({}, req.body);
        var id = parseInt(req.params.id);
        var update = this.Model.getSession().update({ id: id, fields: params });
        
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
        var id = parseInt(req.params.id);
        var destroy = this.Model.getSession().destroy({ id: id });
        
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
    apply: function(context, router) {
        router.get('/sessions', this.find.bind(context));
        router.get('/sessions/:id', this.first.bind(context));
        router.post('/sessions', this.create.bind(context));
        router.put('/sessions/:id', this.update.bind(context));
        router.delete('/sessions/:id', this.destroy.bind(context));
        return router;
    }
};