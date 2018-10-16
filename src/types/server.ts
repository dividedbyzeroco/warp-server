export type ServerConfigType = {
    apiKey: string,
    masterKey: string,
    accessExpiry?: string,
    sessionRevocation?: string,
    passwordSalt?: number,
    databaseURI?: string,
    keepConnections?: boolean,
    charset?: string,
    timeout?: number,
    customResponse?: boolean,
    supportLegacy?: boolean
}