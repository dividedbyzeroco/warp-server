import { URIConfig } from './database';

export interface ServerConfigType {
    databaseURI: string | URIConfig[];
    apiKey?: string;
    masterKey?: string;
    persistent?: boolean;
    customResponse?: boolean;
    restful?: boolean;
}