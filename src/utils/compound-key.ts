import { CompoundDelimiter } from './constants';

export default class CompoundKey {

    public static isUsedBy(key: string): boolean {
        return key.indexOf(CompoundDelimiter) >= 0;
    }

    public static from(key: string): string[] {
        return key.split(CompoundDelimiter);
    }

    public static toString(keys: string[]) {
        return keys.join(CompoundDelimiter);
    }

}