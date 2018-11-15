import Class from '../features/orm/class';

export type ClassCaller<C extends typeof Class> = (type?: any) => C;