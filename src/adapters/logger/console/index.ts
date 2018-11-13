import { ILogger } from '../../../types/logger';
import { LogTypes, Levels } from '../../../types/logger';
import InternalError from '../../../utils/error';

export default class ConsoleLoggerAdapter implements ILogger  {

    /**
     * Private properties
     */
    private appLogName: string;
    private logLevel: Levels;

    /**
     * Constructor
     */
    constructor(appName: string) {
        this.appLogName = appName;
    }

    static get Levels(): {[name: string]: Levels} {
        return Object.freeze({
            Verbose: 'verbose' as Levels,
            Warning: 'warning' as Levels,
            Error: 'error' as Levels,
            Disabled: 'disabled' as Levels
        });
    }

    get statics() {
        return this.constructor as typeof ConsoleLoggerAdapter;
    }

    get appName(): string {
        return this.appLogName;
    }

    get timestamp(): string {
        const date = new Date();
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    set level(value: Levels) {
        if(!Object.values(this.statics.Levels).includes(value)) return;
        this.logLevel = value;
    }

    get level(): Levels {
        if(!this.logLevel)
            return this.statics.Levels.Verbose;
        return this.logLevel;
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
        if(this.level === this.statics.Levels.Verbose)
            console.log.apply(this, [this.header('INFO'), ...message]);
        /* eslint-enable no-console */
    }

    warn(...message: Array<any>) {
        /* eslint-disable no-console */
        if(this.level !== this.statics.Levels.Error && this.level !== this.statics.Levels.Disabled)
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
        if(this.level === this.statics.Levels.Disabled)
            return;
        else if(this.level === this.statics.Levels.Verbose)
            console.error.apply(this, [header, ...message, err.stack]);
        else
            console.error.apply(this, [header, ...message]);
        /* eslint-enable no-console */
    }

}