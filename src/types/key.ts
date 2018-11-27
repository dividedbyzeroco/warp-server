export type NumberType = 'number' | 'integer' | 'float';

export type KeyType = NumberType | 'boolean' | 'date' | 'string' | 'array' | 'object' | 'json';

export interface KeyOptions {
    from?: string;
    to?: string;
    type?: KeyType;
    min?: number;
    max?: number;
}