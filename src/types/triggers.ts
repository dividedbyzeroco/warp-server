import { 
    TriggerBeforeFind, 
    TriggerBeforeFirst, 
    TriggerBeforeGet, 
    TriggerBeforeSave, 
    TriggerAfterSave, 
    TriggerBeforeDestroy, 
    TriggerAfterDestroy 
} from '../utils/constants';
import Query from '../features/orm/query';
import Class from '../features/orm/class';
import User from '../features/auth/user';
import { DataMapper } from '..';

export type TriggerType = typeof TriggerBeforeFind 
    | typeof TriggerBeforeFirst 
    | typeof TriggerBeforeGet 
    | typeof TriggerBeforeSave
    | typeof TriggerAfterSave
    | typeof TriggerBeforeDestroy
    | typeof TriggerAfterDestroy;

export type TriggerQueryAction = <C extends typeof Class, U extends User>(query: Query<C>, user: U) => any;
export type TriggerMutationAction = <U extends User>(classes: DataMapper, user: U) => any;
export type TriggerAction = TriggerQueryAction | TriggerMutationAction;