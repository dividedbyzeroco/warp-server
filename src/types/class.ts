import Class from '../classes/class';
import User from '../classes/user';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';

export type ClassMapType = { [className: string]: typeof Class };

export type ClassFunctionsType = {
    add: (map: ClassMapType) => void;
    get: (className: string) => typeof Class;
};

export type ClassOptionsType = {
    metadata?: MetadataType,
    currentUser?: any,
    keys?: {[name: string]: any},
    keyMap?: KeyMap,
    id?: number,
    createdAt?: string,
    updatedAt?: string,
    isPointer?: boolean
};

export type QueryOptionsType = {
    currentUser?: User,
    select?: Array<string>,
    include?: Array<string>,
    where: ConstraintMap,
    sort?: Array<string | {[key: string]: number}>,
    skip: number,
    limit: number
};

export type QueryGetOptionsType = {
    currentUser?: User,
    select?: Array<string>,
    include?: Array<string>,
    id: number
};

export type MetadataType = {
    sessionToken?: string,
    client?: string,
    sdkVersion?: string,
    appVersion?: string,
    isMaster?: boolean
};

export type PointerObjectType = {
    type: string,
    [name: string]: any,
    id: number,
    attributes?: {[name: string]: any},
    created_at?: string,
    updated_at?: string
};