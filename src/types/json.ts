import { SetJsonTypeName, AppendJsonTypeName } from '../utils/constants';

export type JsonDefinition = {
    type: JsonActionType,
    path: string,
    value: any
};

export type JsonActionType = typeof SetJsonTypeName | typeof AppendJsonTypeName;