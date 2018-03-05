// @flow
/**
 * References
 */
import Model from '../classes/model';
import User from '../classes/user';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';
import { InternalKeys } from '../utils/constants';

export type ModelMapType = { [className: string]: typeof Model.Class };

export type ModelFunctionsType = {
    add: (map: ModelMapType) => void;
    get: (className: string) => typeof Model.Class;
};

export type ModelOptionsType = {
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
    currentUser?: User.Class,
    select?: Array<string>,
    include?: Array<string>,
    where: ConstraintMap,
    sort?: Array<string | {[key: string]: number}>,
    skip: number,
    limit: number
};

export type QueryFirstOptionsType = {
    currentUser?: User.Class,
    select?: Array<string>,
    include?: Array<string>,
    id: number
};

export type MetadataType = {
    sessionToken?: string,
    client?: string,
    sdkVersion?: string,
    appVersion?: string,
    isMaster: boolean
};

export type PointerObjectType = {
    type: string,
    [InternalKeys.Pointes.ClassName]: string,
    id: number,
    attributes?: {[name: string]: any},
    created_at?: string,
    updated_at?: string
};