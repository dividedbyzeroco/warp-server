// References
var moment = require('moment-timezone');
var CronJob = require('cron').CronJob;
var _ = require('underscore');
var WarpError = require('./error');

// Prepare log header
function logHeader() {
    return '[Warp Queue ' + moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss') + ']';
}

// Prepare class
var Queue = {};

// Static methods
_.extend(Queue, {
    _activate: function() {       
        // Set activated value
        this.activated = true;
                
        // Create migration table, if it does not exist
        var schema = new this._schemaQuery(this.className);
        schema.fields({
            'id': {
                type: 'string',
                addons: ['primary']
            },
            'up': 'text',
            'down': 'text',
            'committed_at': 'datetime',
            'created_at': 'datetime',
            'updated_at': 'datetime',
            'deleted_at': 'datetime'
        })
        .createOnce(function() {
            console.log(logHeader(), '`migration` table has been initialized');
        })
        .catch(function(error) {
            console.error(logHeader(), 'Could not create `migration` table', error.message, error.stack);
        });
    },
    create: function(def) {                
        // Prepare subclass
        var QueueSubclass =  {
            _queue: null,
            _action: def.action,
            _active: false,
            _latestSuccess: null,
            _latestError: null,
            name: def.name,
            isActive: function() {
                return this._active;
            },
            getLatestSuccess: function() {
                return this._latestSuccess;
            },
            getLatestError: function() {
                return this._latestError;
            },
            start: function() {
                this._queue.start();
                this._active = true;
                console.log(logHeader(), 'Queue started for `' + def.name + '`');
            },
            stop: function() {
                this._queue.stop();
                this._active = false;
                console.log(logHeader(), 'Queue stopped for `' + def.name + '`');
            }
        };
        
        QueueSubclass._queue = new CronJob({
            cronTime: def.interval || '* * * * * *',
            onTick: function() {
                try
                {
                    console.log(logHeader(), 'Queue for `' + def.name + '` ran on ', moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss'));
                    QueueSubclass._action();
                    QueueSubclass._latestSuccess = moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss');
                }
                catch(ex)
                {
                    QueueSubclass._latestError = {
                        error: ex.message,
                        failed_at: moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss')
                    };
                    
                    console.error(logHeader(), 'ERROR: Queue failed for `' + def.name + '` on ', moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss'), ex);
                }
            },
            onComplete: def.complete || function() {
                console.log(logHeader(), 'Queue for `' + def.name + '` completed on ', moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss'));
            },
            start: false,
            timeZone: def.timezone || 'UTC'
        });
        
        return QueueSubclass;
    }
});

module.exports = Queue;