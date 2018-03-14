// @flow
/**
 * References
 */
import { ILogger } from '../../../types/logger';
import type { LogTypes, Levels } from '../../../types/logger';
import InternalError from '../../../utils/error';

export default class ConsoleLoggerAdapter implements ILogger  {

    /**
     * Private properties
     */
    _appName: string;
    _level: Levels;

    /**
     * Constructor
     */
    constructor(appName: string) {
        this._appName = appName;
    }

    static get Levels(): {[name: string]: Levels} {
        return Object.freeze({
            Verbose: 'verbose',
            Warning: 'warning',
            Error: 'error',
            Disabled: 'disabled'
        });
    }

    get appName(): string {
        return 'Warp Server';
    }

    get timestamp(): string {
        const date = new Date();
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    set level(value: Levels) {
        if(!Object.values(this.constructor.Levels).includes(value)) return;
        this._level = value;
    }

    get level(): Levels {
        if(!this._level)
            return this.constructor.Levels.Verbose;
        return this._level;
    }

    header(type: LogTypes): string  {
        return `[${this.appName} ${this.timestamp}][${type}]`;
    }

    bare(...message: Array<any>) {
        /* eslint-disable no-console */
        console.log.apply(this, [...message]);
        /* eslint-enable no-console */
    }

    info(...message: Array<any>) {
        /* eslint-disable no-console */
        if(this.level === this.constructor.Levels.Verbose)
            console.log.apply(this, [this.header('INFO'), ...message]);
        /* eslint-enable no-console */
    }

    warn(...message: Array<any>) {
        /* eslint-disable no-console */
        if(this.level !== this.constructor.Levels.Error && this.level !== this.constructor.Levels.Disabled)
            console.warn.apply(this, [this.header('WARNING'), ...message]);
        /* eslint-enable no-console */
    }

    error(err: Error, ...message: Array<any>) {
        // Prepare header
        let header = this.header('ERROR');
        
        // Get code if applicable
        if(err instanceof InternalError) {
            header = header.concat(`[Code: ${err.code}]`);
        }

        /* eslint-disable no-console */
        if(this.level === this.constructor.Levels.Disabled)
            return;
        else if(this.level === this.constructor.Levels.Verbose)
            console.error.apply(this, [header, ...message, err.stack]);
        else
            console.error.apply(this, [header, ...message]);
        /* eslint-enable no-console */
    }

}