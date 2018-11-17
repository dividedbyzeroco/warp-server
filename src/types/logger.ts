export interface ILogger {
    appName: string;
    timestamp: string;
    level: Levels;
    header(type: LogTypes): string;
    bare(...message: any[]): void;
    info(...message: any[]): void;
    warn(...message: any[]): void;
    error(err: Error, ...message: any[]): void;
}

export declare const ILogger: {
    new(appName: string): ILogger;
};

export type LogTypes = 'INFO' | 'WARNING' | 'ERROR';
export type Levels = 'verbose' | 'warning' | 'error' | 'disabled';