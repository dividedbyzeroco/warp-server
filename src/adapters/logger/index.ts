import { ILogger } from '../../types/logger';
import Error from '../../utils/error';
import ConsoleLogger from './console';

export default class Logger {

    static Channels = Object.freeze({
        'console': ConsoleLogger
    });

    /**
     * Static use
     */
    static use(channel: string, name: string, level?: string): ILogger {
        // Get log channel
        const logChannel = this.Channels[channel];

        // Check if logger exists
        if(typeof logChannel === 'undefined')
            throw new Error(Error.Code.MissingConfiguration, `Logger \`${channel}\` is not supported`);
        else {
            const logger = new logChannel(name);
            logger.level = level;
            return logger;
        }
    }
}