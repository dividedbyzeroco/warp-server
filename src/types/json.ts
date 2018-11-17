import { SetJsonTypeName, AppendJsonTypeName } from '../utils/constants';

export interface JsonDefinition {
    type: JsonActionType;
    path: string;
    value: any;
}

export type JsonActionType = typeof SetJsonTypeName | typeof AppendJsonTypeName;