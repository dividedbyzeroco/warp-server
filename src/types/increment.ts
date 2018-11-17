import { IncrementTypeName } from '../utils/constants';

export interface IncrementDefinition {
    type: typeof IncrementTypeName;
    value: number;
}