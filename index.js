// References
var express = require('express');
var _ = require('underscore');

// Define Warp Server
var WarpServer = {
    Query: {
        View: require('./query/view'),
        Action: require('./query/action'),
        Schema: require('./query/schema')
    },
    Model: require('./model'),
    Error: require('./error'),
    Migration: require('./migration')
};

// Static methods
_.extend(WarpServer, {
    initialize: function(config) {        
        if(!config.host) throw new this.Error(this.Error.Code.MissingConfiguration, 'DB Host must be set');
        if(!config.user) throw new this.Error(this.Error.Code.MissingConfiguration, 'DB User must be set');
        if(!config.password) throw new this.Error(this.Error.Code.MissingConfiguration, 'DB Password must be set');
        if(!config.apiKey) throw new this.Error(this.Error.Code.MissingConfiguration, 'API Key must be set');
        if(!config.masterKey) throw new this.Error(this.Error.Code.MissingConfiguration, 'Master Key must be set')
                
        this._database = require('./services/database').initialize(config);
        this.Query.View.initialize(this._database);
        this.Query.Action.initialize(this._database);
        this.Query.Schema.initialize(this._database);
        this.Model.initialize(this.Query);
        this.Migration.initialize(config, this.Query);

        // Prepare routers
        var router = express.Router();
        var middleware = require('./routers/middleware');
        var classRouter = require('./routers/classes');
        var userRouter = require('./routers/users');
        var sessionRouter = require('./routers/sessions');
        var migrationRouter = require('./routers/migrations');
        
        // Apply routers
        router.use(middleware.enableCors);
        router.use(middleware.requireAPIKey(config.apiKey));
        router.use(middleware.sessionToken);
        classRouter.apply(this, router);
        userRouter.apply(this, router);
        sessionRouter.apply(this, router);
        migrationRouter.apply(this, router);
        
        return router;
    }
});

// Export modules
module.exports = WarpServer;