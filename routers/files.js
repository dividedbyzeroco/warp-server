var _ = require('underscore');

module.exports = {
    create: function(req, res, next) {        
        // Load the file sent
        this.Storage.load(req, res).then(function() 
        {
            // Prepare file options
            var filename = req.body.name;
            var file = req.file.buffer;
            var options = {
                filename: filename,
                file: file
            };
            
            // Upload file
            return this.Storage.upload(options);
        }.bind(this))
        .then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });    
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    destroy: function(req, res, next) {
        var key = req.body.key;
        
        // Delete object
        this.Storage.destroy(key).then(function(result)
        {
            res.json({ status: 200, message: 'Success', result: result });
        })
        .catch(function(err)
        {
            next(err);
        });
    },
    apply: function(context, router) {
        router.post('/files', this.create.bind(context));
        router.delete('/files', this.destroy.bind(context));
        return router;
    }
};