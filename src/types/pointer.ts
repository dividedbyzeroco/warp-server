import { Class } from '..';

export type ClassDefinition<C extends typeof Class> = (type?: any) => C;