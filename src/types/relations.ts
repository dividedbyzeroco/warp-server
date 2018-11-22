import Class from '../features/orm/class';
import { RelationDefinition } from '../features/orm/relation';

export type ClassCaller<C extends typeof Class> = (type?: any) => C;

export interface RelationsMap { [name: string]: RelationDefinition<typeof Class>; }