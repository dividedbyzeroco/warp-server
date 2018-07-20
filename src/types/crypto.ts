export interface ICryptoAdapter {
    hash(password: string): string;
    validate(password: string, hashed: string): boolean;
} 

export declare const ICryptoAdapter: {
    new(salt: string | number): ICryptoAdapter;
}