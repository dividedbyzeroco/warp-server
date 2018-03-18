export type ServerConfigType = {
    apiKey: string,
    masterKey: string,
    passwordSalt: number,
    sessionDuration: string,
    databaseURI: string,
    keepConnections: boolean,
    charset: string,
    timeout: number,
    requestLimit?: number,
    customResponse: boolean,
    supportLegacy: boolean
}