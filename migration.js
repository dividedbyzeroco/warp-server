// References
var moment = require('moment-timezone');
var _ = require('underscore');
var WarpError = require('./error');

/******************************************************/

// Class constructor
var Migration = function(def) {
    // Check if migrations are activated
    if(!Migration.activated) throw Migration._deactivatedError;
    
    // Check if id is valid
    if(def.id === 'current') throw new WarpError(WarpError.Code.InvalidObjectKey, '`current` cannot be used as a migration id');
      
    // Initialize keys    
    this.id = def.id;
    this.up = def.up;
    this.down = def.down;
};

// Instance methods
_.extend(Migration.prototype, {
    create: function() {
        // Insert a migration
        var now = moment().tz('UTC');
        var action = new Migration._actionQuery(Migration.className);  
        return action.fields({
            'id': this.id,
            'up': JSON.stringify(this.up),
            'down': JSON.stringify(this.down),
            'created_at': now.format('YYYY-MM-DD HH:mm:ss'),
            'updated_at': now.format('YYYY-MM-DD HH:mm:ss')
        })
        .create()
        .then(function() {
            return {
                id: this.id,
                created_at: now.format('YYYY-MM-DD HH:mm:ss'),
                updated_at: now.format('YYYY-MM-DD HH:mm:ss')
            };
        }.bind(this));
    },
    update: function() {
        // Update a migration
        var now = moment().tz('UTC');
        var action = new Migration._actionQuery(Migration.className, this.id);        
        return action.fields({
            'up': JSON.stringify(this.up),
            'down': JSON.stringify(this.down),
            'updated_at': now.format('YYYY-MM-DD HH:mm:ss')
        })
        .update()
        .then(function() {
            return {
                id: this.id,
                updated_at: now.format('YYYY-MM-DD HH:mm:ss')
            };
        }.bind(this));
    },
    destroy: function() {
        // Update a migration
        var now = moment().tz('UTC');
        var action = new Migration._actionQuery(Migration.className, this.id);        
        return action.fields({
            'updated_at': now.format('YYYY-MM-DD HH:mm:ss'),
            'deleted_at': now.format('YYYY-MM-DD HH:mm:ss')
        })
        .update()
        .then(function() {
            return {
                id: this.id,
                updated_at: now.format('YYYY-MM-DD HH:mm:ss'),
                deleted_at: now.format('YYYY-MM-DD HH:mm:ss')
            };
        }.bind(this));
    },
    commit: function() {
        // Execute Up
    },
    revert: function() {
        // Execute Down
    }
});

// Static methods
_.extend(Migration, {
    _viewQuery: null,
    _actionQuery: null,
    _schemaQuery: null,
    _deactivatedError: new WarpError(WarpError.Code.ForbiddenOperation, 'The migrations feature is not activated for this application'),
    _activate: function() {       
        // Set activated value
        this.activated = true;
                 
        // Create migration table, if it does not exist
        var schema = new this._schemaQuery(this.className);
        schema.fields({
            'id': {
                type: 'string',
                details: ['primary']
            },
            'up': 'text',
            'down': 'text',
            'committed_at': 'datetime',
            'created_at': 'datetime',
            'updated_at': 'datetime',
            'deleted_at': 'datetime'
        })
        .createOnce(function() {
            console.log('[Warp Migration] `migration` table has been initialized');
        })
        .catch(function(error) {
            console.error('[Warp Migration] Could not create `migration` table', error.message, error.stack);
        });
    },
    className: 'migration',
    activated: false,
    initialize: function(config, query) {
        this._viewQuery = query.View;
        this._actionQuery = query.Action;
        this._schemaQuery = query.Schema;
        
        // Check if the migrations feature is activated
        if(!config.migrations || typeof config.migrations.activated === 'undefined' ||  config.migrations.activated)
        {
            this.className = config.className || this.className;
            this._activate();
        }
    },
    create: function(id, up, down) {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        return new this({ id: id, up: up, down: down });
    },
    commit: function() {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        
        // Query all pending migrations
        var query = new this._viewQuery(this.className);
        var migrated = [];
        
        // Retrieve all migrations which have not been committed
        // And which have not been deleted
        // Then, sort the results in chronological order
        return query.where({
            'committed_at': {
                'ex': false
            },
            'deleted_at': {
                'ex': false
            }
        })
        .sort([
            { 'created_at': 1 }
        ])
        .find(function(migrations) {
            // Check if pending migrations exist
            if(migrations.length == 0) throw new WarpError(WarpError.Code.QueryError, 'No pending migrations found');
            
            // Create base promise
            var promise = new Promise(function(resolve, reject) {
                resolve();
            });
            
            // Loop through each pending migration
            for(var index in migrations)
            {
                // Retrieve migration
                var def = migrations[index];
                var migration = this.create(def.id, JSON.parse(def.up), JSON.parse(def.down));
                
                // Append a new promise to the base promise
                promise = promise.then(function(previous) {
                    if(previous) migrated.push(previous);
                    return migration.commit();
                });
            }
            
            // Return the chained promises
            // When completed, return the list of migrated items
            return promise.then(function() {
                return migrated;
            });
        }.bind(this))
        .catch(function(error) {
            console.error('[Warp Migration] Could not commit all migrations', error.message, error.stack);
            throw new WarpError(WarpError.Code.InternalServerError, 'Could not commit all migrations: ' + error.message);
        });
    },
    current: function() {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        
        // Query the latest committed migration
        var query = new this._viewQuery(this.className);
        
        // Retrieve the latest committed migration
        // which has not been deleted
        // Then, sort the results in reverse chronological order
        return query.where({
            'committed_at': {
                'ex': true
            },
            'deleted_at': {
                'ex': false
            }
        })
        .sort([
            { 'created_at': -1 }
        ])
        .first(function(def) {
            // Check if commited migration exist
            if(!def) throw new WarpError(WarpError.Code.QueryError, 'No migration has been committed yet');
            
            // Retrieve migration
            var migration = this.create(def.id, JSON.parse(def.up), JSON.parse(def.down));
                        
            // Return the latest committed migration
            return migration;
        }.bind(this))
        .catch(function() {            
            console.error('[Warp Migration] Could not fetch the latest migration', error.message, error.stack);
            throw new WarpError(WarpError.Code.InternalServerError, 'Could not fetch the latest migration: ' + error.message);
        });
    },
    revert: function() {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        
        // Query the latest committed migration
        var query = new this._viewQuery(this.className);
        
        // Retrieve the current migration
        return this.current()
        .then(function(migration) {                        
            // Attempt to revert the migration
            return migration.revert();
        }.bind(this))
        .catch(function(error) {
            console.error('[Warp Migration] Could not revert latest migration', error.message, error.stack);
            throw new WarpError(WarpError.Code.InternalServerError, 'Could not revert latest migration: ' + error.message);
        });
    },
    reset: function() {
        // Check if migrations are activated
        if(!Migration.activated) throw Migration._deactivatedError;
        
        // Query the latest committed migrations
        var query = new this._viewQuery(this.className);
        var reverted = [];
        
        // Retrieve the latest committed migrations
        // which have not been deleted
        // Then, sort the results in reverse chronological order
        return query.where({
            'committed_at': {
                'ex': true
            },
            'deleted_at': {
                'ex': false
            }
        })
        .sort([
            { 'created_at': -1 }
        ])
        .find(function(migrations) {
            // Check if commited migrations exist
            if(migrations.length == 0) throw new WarpError(WarpError.Code.QueryError, 'No migration has been committed yet');
            
            // Create base promise
            var promise = new Promise(function(resolve, reject) {
                resolve();
            });
            
            // Loop through each pending migration
            for(var index in migrations)
            {
                // Retrieve migration
                var def = migrations[index];
                var migration = this.create(def.id, JSON.parse(def.up), JSON.parse(def.down));
                
                // Append a new promise to the base promise
                promise = promise.then(function(previous) {
                    if(previous) reverted.push(previous);
                    return migration.revert();
                });
            }
            
            // Return the chained promises
            // When completed, return the list of migrated items
            return promise.then(function() {
                return reverted;
            });
        }.bind(this))
        .catch(function() {            
            console.error('[Warp Migration] Could not reset migrations', error.message, error.stack);
            throw new WarpError(WarpError.Code.InternalServerError, 'Could not reset migrations: ' + error.message);
        });
    }
});

module.exports = Migration;