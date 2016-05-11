var _ = require('underscore');

module.exports = {
    find: function(req, res, next) {
        var className = req.params.className;
        var options = {
            select: req.query.select? JSON.parse(req.query.select) : {},
            where: req.query.where? JSON.parse(req.query.where) : {},
            sort: req.query.order? JSON.parse(req.query.order) : [],
            limit: req.query.limit || 100,
            skip: req.query.skip || 0
        };
        
        var find = this.Model.getByClassName(className).find(options);
            
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
    first: function(req, next) {
        var className = req.params.className;
        var id = req.params.id;
        var first = this.Model.getByClassName(className).first(id);
        
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
        var create = this.Model.getByClassName(className).create({ fields: fields });
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
        var id = req.params.id;
        var update = this.Model.getByClassName(className).update({ id: id, fields: params });
        
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
        var id = req.params.id;
        var destroy = this.Model.getByClassName(className).destroy({ id: id });
        
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
        router.get('/classes/:className', this.find.bind(context));
        router.get('/classes/:className/:id', this.first.bind(context));
        router.post('/classes/:className', this.create.bind(context));
        router.put('/classes/:className/:id', this.update.bind(context));
        router.delete('/classes/:className/:id', this.destroy.bind(context));
        return router;
    }
};