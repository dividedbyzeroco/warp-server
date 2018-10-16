import Class from '../classes/class';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';

export type ClassMapType = { [className: string]: typeof Class };

export type ClassFunctionsType = {
    add: (map: ClassMapType) => void;
    get: (className: string) => typeof Class;
};

export type ClassOptionsType = {
    keys?: {[name: string]: any},
    keyMap?: KeyMap,
    id?: number,
    createdAt?: string,
    updatedAt?: string,
    isPointer?: boolean
};

export type QueryOptionsType = {
    select?: Array<string>,
    include?: Array<string>,
    where: ConstraintMap,
    sort?: Array<string | {[key: string]: number}>,
    skip: number,
    limit: number
};

export type QueryGetOptionsType = {
    select?: Array<string>,
    where?: ConstraintMap,
    include?: Array<string>,
    id: number
};

export type PointerObjectType = {
    type: string,
    [name: string]: any,
    id: number,
    attributes?: {[name: string]: any},
    created_at?: string,
    updated_at?: string
};