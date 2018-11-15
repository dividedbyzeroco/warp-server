import { CompoundDelimiter } from './constants';

export default class CompoundKey {

    static isUsedBy(key: string): boolean {
        return key.indexOf(CompoundDelimiter) >= 0;
    }

    static from(key: string): string[] {
        return key.split(CompoundDelimiter);
    }

    static toString(keys: string[]) {
        return keys.join(CompoundDelimiter);
    }

}