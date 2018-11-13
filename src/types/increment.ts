import { IncrementTypeName } from '../utils/constants';

export type IncrementDefinition = {
    type: typeof IncrementTypeName,
    value: number
};