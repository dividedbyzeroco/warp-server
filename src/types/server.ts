import { URIConfig } from "./database";

export type ServerConfigType = {
    apiKey: string,
    masterKey: string,
    databaseURI: string | URIConfig[],
    persistent?: boolean,
    charset?: string,
    timeout?: number,
    customResponse?: boolean
}