export default class CompoundKey {
    static readonly Delimiter: string;
    static isUsedBy(key: string): boolean;
    static from(key: string): string[];
}
