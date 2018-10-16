export default class CompoundKey {

    static get Delimiter(): string {
        return '|';
    }

    static isUsedBy(key: string): boolean {
        return key.indexOf(this.Delimiter) >= 0;
    }

    static from(key: string): string[] {
        return key.split(this.Delimiter);
    }

}