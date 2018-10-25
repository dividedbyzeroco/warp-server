import Class from '../features/orm/class';

export type ClassMapType<C extends typeof Class> = { [className: string]: C };