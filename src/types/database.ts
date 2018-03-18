import Model, { Pointer } from '../classes/model';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';
export interface IDatabaseAdapter {
    currentTimestamp: string;
    initialize(): Promise<void>;
    find(
        source: string,
        className: string, 
        select: Array<string>, 
        joins: { [key: string]: JoinKeyType },
        where: ConstraintMap,
        sort: Array<string>,
        skip: number,
        limit: number 
    ): Promise<Array<KeyMap>>;
    get(source: string,
        className: string, 
        select: Array<string>, 
        joins: { [key: string]: JoinKeyType },
        id: number
    ): Promise<KeyMap | null>;
    create(source: string, keys: KeyMap): Promise<number>;
    update(source: string, keys: KeyMap, id: number): Promise<void>;
    destroy(source: string, keys: KeyMap, id: number): Promise<void>;  
}

export declare const IDatabaseAdapter: {
    new(config: DatabaseConfigType): IDatabaseAdapter;
}

export type DatabaseOptionsType = {
    databaseURI: string,
    keepConnections: boolean,
    charset: string,
    timeout: number
};

export type DatabaseConfigType = {
    host: string,
    port?: number,
    user: string,
    password: string,
    schema?: string,
    keepConnections?: boolean,
    charset?: string,
    timeout?: number
};

export type FindOptionsType = {
    source: string,
    classAlias: string,
    select: Array<string>,
    joins: {[key: string]: JoinKeyType},
    where: ConstraintMap
};

export type SubqueryOptionsType = {
    className: string,
    select: string,
    where: { [key: string]: { [key: string]: any }}
};

export type DatabaseResult = {
    id: number,
    rows: Array<object>
}

export type JoinKeyType = {
    join: Pointer,
    included: boolean
};