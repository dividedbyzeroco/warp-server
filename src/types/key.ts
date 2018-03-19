export interface IKeyManager {
    isNew: boolean;
    readonly name: string;
    readonly setter: (value: any) => any;
    readonly getter: (value: any) => any;
}

export type KeyDefinition = {
    type: string
};