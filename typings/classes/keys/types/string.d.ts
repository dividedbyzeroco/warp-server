import { KeyManager } from '../key';
export declare type StringOptions = {
    minLength?: number;
    maxLength?: number;
};
export default function StringKey(name: any, opts: StringOptions): KeyManager;
