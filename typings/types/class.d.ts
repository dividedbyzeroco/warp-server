import Class from '../classes/class';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';
export declare type ClassMapType = {
    [className: string]: typeof Class;
};
export declare type ClassFunctionsType = {
    add: (map: ClassMapType) => void;
    get: (className: string) => typeof Class;
};
export declare type ClassOptionsType = {
    keys?: {
        [name: string]: any;
    };
    keyMap?: KeyMap;
    id?: number;
    createdAt?: string;
    updatedAt?: string;
    isPointer?: boolean;
};
export declare type QueryOptionsType = {
    select?: Array<string>;
    include?: Array<string>;
    where: ConstraintMap;
    sort?: Array<string | {
        [key: string]: number;
    }>;
    skip: number;
    limit: number;
};
export declare type QueryGetOptionsType = {
    select?: Array<string>;
    where?: ConstraintMap;
    include?: Array<string>;
    id: number;
};
export declare type PointerObjectType = {
    type: string;
    [name: string]: any;
    id: number;
    attributes?: {
        [name: string]: any;
    };
    created_at?: string;
    updated_at?: string;
};
