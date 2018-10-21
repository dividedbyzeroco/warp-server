import { Class } from '..';

export type ClassCaller<C extends typeof Class> = (type?: any) => C;