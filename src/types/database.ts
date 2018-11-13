import Pointer from '../features/orm/pointer';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';
import { ILogger } from './logger';

export type DatabaseAction = 'read' | 'write';

export interface IDatabaseAdapter {
    currentTimestamp: string;
    initialize(): Promise<void>;
    find(
        source: [string, string],
        columns: Map<string, string>, 
        relations: Map<string, Pointer>,
        constraints: ConstraintMap,
        sorting: Array<string>,
        skipped: number,
        limitation: number 
    ): Promise<Array<KeyMap>>;
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

export type QueryOptionsType = {
    source: [string, string],
    columns: Map<string, string>, 
    relations: Map<string, Pointer>,
    constraints: ConstraintMap,
    sorting: Array<string>,
    skipped: number,
    limitation: number 
};

export type FindClauseOptionsType = {
    source: [string, string],
    columns: Map<string, string>,
    relations: Map<string, Pointer>,
    constraints: ConstraintMap
};

export type SubqueryOptionsType = {
    className: string,
    select: Map<string, string>,
    where: { [key: string]: { [key: string]: any } }
};