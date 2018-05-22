import { ILogger } from '../../types/logger';
import ConsoleLogger from './console';
export default class Logger {
    static Channels: Readonly<{
        'console': typeof ConsoleLogger;
    }>;
    /**
     * Static use
     */
    static use(channel: string, name: string, level?: string): ILogger;
}
