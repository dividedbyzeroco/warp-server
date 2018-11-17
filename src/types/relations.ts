import Class from '../features/orm/class';
import { PointerDefinition } from '../features/orm/pointer';

export interface RelationsMap { [name: string]: PointerDefinition<typeof Class>; }