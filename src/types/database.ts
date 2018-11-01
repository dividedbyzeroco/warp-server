import Pointer from '../features/orm/pointer';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';
import { ILogger } from './logger';

export type DatabaseAction = 'read' | 'write';

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
        where: ConstraintMap,
        id: number
    ): Promise<KeyMap | null>;
    create(source: string, keys: KeyMap): Promise<number>;
    update(source: string, keys: KeyMap, id: number): Promise<void>;
    destroy(source: string, keys: KeyMap, id: number): Promise<void>;  
}

export declare const IDatabaseAdapter: {
    new(config: DatabaseConfig): IDatabaseAdapter;
}

export type DatabaseConfig = {
    uris: URIConfig[],
    persistent: boolean,
    logger: ILogger
}

export type URIConfig = {
    uri: string,
    action: DatabaseAction
}; 

export type ConnectionConfig = {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    [config: string]: any
};

export type ConnectionCollection = {
    write: ConnectionConfig[],
    read: ConnectionConfig[]
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
    where: { [key: string]: { [key: string]: any } }
};

export type DatabaseResult = {
    id: number,
    rows: Array<object>
}

export type JoinKeyType = {
    join: Pointer,
    included: boolean
};