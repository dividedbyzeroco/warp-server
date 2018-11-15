import { URIConfig } from "./database";

export type ServerConfigType = {
    apiKey: string,
    masterKey: string,
    databaseURI: string | URIConfig[],
    persistent?: boolean,
    customResponse?: boolean,
    restful?: boolean
}