import Class from '../features/orm/class';
import { PointerDefinition } from '../features/orm/pointer';

export type RelationsMap = { [name: string]: PointerDefinition<typeof Class, Class> };