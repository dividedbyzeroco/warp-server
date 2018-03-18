export interface ILogger {
    appName: string;
    timestamp: string;
    level: Levels;
    header(type: LogTypes): string;
    bare(...message: Array<any>): void;
    info(...message: Array<any>): void;
    warn(...message: Array<any>): void;
    error(err: Error, ...message: Array<any>): void;
}

export declare const ILogger: {
    new(appName: string): ILogger;
}

export type LogTypes = 'INFO' | 'WARNING' | 'ERROR';
export type Levels = 'verbose' | 'warning' | 'error' | 'disabled';