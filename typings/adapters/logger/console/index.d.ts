import { ILogger } from '../../../types/logger';
import { LogTypes, Levels } from '../../../types/logger';
export default class ConsoleLoggerAdapter implements ILogger {
    /**
     * Private properties
     */
    _appName: string;
    _level: Levels;
    /**
     * Constructor
     */
    constructor(appName: string);
    static readonly Levels: {
        [name: string]: Levels;
    };
    readonly statics: typeof ConsoleLoggerAdapter;
    readonly appName: string;
    readonly timestamp: string;
    level: Levels;
    header(type: LogTypes): string;
    bare(...message: Array<any>): void;
    info(...message: Array<any>): void;
    warn(...message: Array<any>): void;
    error(err: Error, ...message: Array<any>): void;
}
