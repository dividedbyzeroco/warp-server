export type NumberType = 'number' | 'integer' | 'float';

export type KeyType = NumberType | 'boolean' | 'date' | 'string' | 'array' | 'object' | 'json';

export type KeyOptions = {
    via?: string,
    type?: KeyType,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
    decimals?: number
};