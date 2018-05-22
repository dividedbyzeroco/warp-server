import Class from '../classes/class';
import User from '../classes/user';
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
    metadata?: MetadataType;
    currentUser?: any;
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
    currentUser?: User;
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
    currentUser?: User;
    select?: Array<string>;
    include?: Array<string>;
    id: number;
};
export declare type MetadataType = {
    sessionToken?: string;
    client?: string;
    sdkVersion?: string;
    appVersion?: string;
    isMaster?: boolean;
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
