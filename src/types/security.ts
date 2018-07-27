export type SecurityConfigType = {
    apiKey: string,
    masterKey: string,
    accessExpiry?: string,
    sessionRevocation?: string,
    passwordSalt?: number
}