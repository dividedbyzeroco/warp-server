import { URIConfig } from './database';

export interface ServerConfigType {
    apiKey: string;
    masterKey: string;
    databaseURI: string | URIConfig[];
    persistent?: boolean;
    customResponse?: boolean;
    restful?: boolean;
}