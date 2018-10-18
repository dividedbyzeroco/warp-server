import { KeyManager } from '../key';
export declare type NumberKeyOptions = {
    type: 'number' | 'integer' | 'float';
    decimals?: number;
    min?: number;
    max?: number;
};
export default function NumberKey(name: string, opts: NumberKeyOptions): KeyManager;
